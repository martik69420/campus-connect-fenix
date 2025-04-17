
import * as React from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { User, AuthContextType, ProfileUpdateData } from "./types";
import { 
  createProfile,
  formatUser,
  updateOnlineStatus,
  loginUser,
  registerUser,
  getCurrentUser,
  updateUserProfile,
  changePassword,
  validateCurrentPassword,
  parseAuthError
} from "./authUtils";
// Import the standalone toast function, not the hook
import { toast } from "@/components/ui/use-toast";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State hooks for managing auth state
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<any>(null);

  // Set up auth listener first, then check for existing session
  React.useEffect(() => {
    console.log("Setting up auth listener");
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
          try {
            // Use setTimeout to prevent potential deadlocks in the auth state event handling
            setTimeout(async () => {
              const currentUser = await getCurrentUser();
              if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                updateOnlineStatus(currentUser.id, true);
              } else {
                // User signed in but profile not found - attempt to create profile
                try {
                  const username = session.user.email?.split('@')[0] || 'user';
                  const displayName = session.user.user_metadata?.displayName || username;
                  const school = session.user.user_metadata?.school || 'Unknown School';
                  
                  await createProfile(session.user.id, username, displayName, school);
                  const newUser = await getCurrentUser();
                  
                  if (newUser) {
                    setUser(newUser);
                    setIsAuthenticated(true);
                  } else {
                    // Still couldn't get user profile, sign out
                    await supabase.auth.signOut();
                    setUser(null);
                    setIsAuthenticated(false);
                    setAuthError("Failed to set up user profile. Please try again or contact support.");
                  }
                } catch (profileError) {
                  console.error("Error creating user profile:", profileError);
                  await supabase.auth.signOut();
                  setUser(null);
                  setIsAuthenticated(false);
                  setAuthError("Error setting up user profile. Please try again.");
                }
              }
            }, 0);
          } catch (error) {
            console.error("Error getting user:", error);
            setAuthError("Error retrieving user profile");
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Initial auth state check
    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Update online status when window focus changes
  React.useEffect(() => {
    if (!user) return;
    
    const handleVisibilityChange = () => {
      if (user && document.visibilityState === "visible") {
        updateOnlineStatus(user.id, true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Use the Navigator's sendBeacon API for beforeunload
    const handleBeforeUnload = () => {
      if (user) {
        // Using Navigator.sendBeacon which is designed for this exact scenario
        navigator.sendBeacon(
          "/api/update-status", 
          JSON.stringify({ userId: user.id, isOnline: false })
        );
        
        // As a fallback, also directly update status in Supabase
        try {
          updateOnlineStatus(user.id, false);
        } catch (e) {
          console.error("Error updating online status on page unload", e);
        }
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (!usernameOrEmail.trim() || !password.trim()) {
        setAuthError("Please enter both username/email and password");
        return false;
      }
      
      console.log("Performing credential validation");
      
      try {
        // Attempt to login
        const user = await loginUser(usernameOrEmail, password);
        
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
          
          toast({
            title: "Login successful",
            description: `Welcome back, ${user.displayName || user.username}!`,
          });
          
          return true;
        }
        
        setAuthError("Invalid username or password. Please check your credentials and try again.");
        return false;
      } catch (error: any) {
        // Handle specific auth errors
        if (error.message?.includes('Email not confirmed')) {
          setAuthError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
        } else {
          setAuthError(error.message || "Login failed. Please check your credentials and try again.");
        }
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Login failed. Please check your credentials and try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    school: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Basic validation
      if (!email.trim() || !password.trim() || !username.trim() || !displayName.trim() || !school.trim()) {
        setAuthError("All fields are required");
        return false;
      }
      
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long");
        return false;
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        setAuthError("Please enter a valid email address");
        return false;
      }
      
      try {
        // Use the registerUser helper which includes profile creation
        const result = await registerUser(email, password, username, displayName, school);
        
        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
          
          toast({
            title: "Registration successful",
            description: "Please check your email for a confirmation link to activate your account.",
            duration: 6000,
          });
          
          return true;
        } else {
          setAuthError("Registration failed - no user data returned");
          return false;
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        setAuthError(error.message || "Registration failed");
        return false;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "Registration failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (user) {
        await updateOnlineStatus(user.id, false);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      setUser(null);
      setIsAuthenticated(false);
      console.log("User successfully logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the user profile
  const handleUpdateUserProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      if (!user) return false;
      
      setIsLoading(true);
      const success = await updateUserProfile(user.id, profileData);
      
      if (success && user) {
        // Update local user state with new profile data
        setUser({
          ...user,
          ...profileData,
        });
      }
      
      return success;
    } catch (error: any) {
      console.error("Profile update error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Password change functionality
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      if (!user) return false;
      
      setIsLoading(true);
      
      // First validate the current password
      const isCurrentPasswordValid = await validateCurrentPassword(user.email || "", currentPassword);
      
      if (!isCurrentPasswordValid) {
        setAuthError("Current password is incorrect");
        return false;
      }
      
      // Then change to the new password
      const success = await changePassword(newPassword);
      return success;
    } catch (error: any) {
      console.error("Password change error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      if (!user) {
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update user profile with new avatar URL
      const success = await updateUserProfile(user.id, {
        avatar: avatarUrl
      });

      if (success && user) {
        // Update local user state
        setUser({
          ...user,
          avatar: avatarUrl
        });
        
        return avatarUrl;
      }
      
      return null;
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      return null;
    }
  };
  
  // Update user data
  const updateUser = (userData: Partial<User>): void => {
    if (!user) return;
    setUser({
      ...user,
      ...userData
    });
  };
  
  // Add coins to user balance
  const addCoins = async (amount: number, reason?: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Update coins in database
      const { error } = await supabase
        .from('profiles')
        .update({ coins: (user.coins || 0) + amount })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUser({
        ...user,
        coins: (user.coins || 0) + amount
      });
      
      // Log the transaction
      console.log(`Coin transaction for user ${user.id}: ${amount} coins (${reason || 'No reason provided'})`);
      
      return true;
    } catch (error) {
      console.error("Error adding coins:", error);
      return false;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setAuthError(error.message);
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      setAuthError(error.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // Update password (used after reset)
  const updatePassword = async (password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        console.error("Update password error:", error);
        setAuthError(error.message);
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
    } catch (error: any) {
      console.error("Update password error:", error);
      setAuthError(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      if (!user) return;
      
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error: any) {
      console.error("Refresh user error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    session,
    login,
    logout,
    register,
    updateProfile: handleUpdateUserProfile,
    updateUserProfile: handleUpdateUserProfile,
    changePassword: handleChangePassword,
    uploadProfilePicture,
    updateUser,
    addCoins,
    authError,
    resetPassword,
    updatePassword,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
