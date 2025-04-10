import * as React from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { User, AuthContextType, ProfileUpdateData } from "./types";
import { 
  loginUser, 
  registerUser, 
  changePassword as changePasswordUtil, 
  validateCurrentPassword, 
  updateOnlineStatus, 
  getCurrentUser, 
  updateUserProfile as updateUserProfileUtil 
} from "./authUtils";
// Import the standalone toast function, not the hook
import { toast } from "@/components/ui/use-toast";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fixed useState usage
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = React.useState(false);

  // Check for existing session first
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            updateOnlineStatus(currentUser.id, true);
          } else {
            // User is logged in but doesn't have a profile - sign them out
            console.log("User is logged in but doesn't have a profile - signing out");
            await supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setSessionChecked(true);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setIsAuthenticated(false);
        setSessionChecked(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);
  
  // Set up auth listener in a separate effect
  React.useEffect(() => {
    console.log("Setting up auth listener");
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        // Skip processing for the initial session event since we already handled it
        if (event === "INITIAL_SESSION") {
          return;
        }
        
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              setIsAuthenticated(true);
              updateOnlineStatus(currentUser.id, true);
            } else {
              // User signed in but profile not found
              console.error("User signed in but profile not found");
              await supabase.auth.signOut();
              setUser(null);
              setIsAuthenticated(false);
              setAuthError("User profile not found. Please contact support.");
            }
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
        // This will execute asynchronously and might be interrupted
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (!username.trim() || !password.trim()) {
        setAuthError("Please enter both username and password");
        return false;
      }
      
      console.log("Performing credential validation");
      
      // Attempt to login with username validation
      const user = await loginUser(username, password);
      
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        
        // Using the standalone toast function
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.displayName || user.username}!`,
        });
        
        return true;
      }
      
      setAuthError("Invalid username or password. Please check your credentials and try again.");
      return false;
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
      
      const result = await registerUser(email, password, username, displayName, school);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return true;
      }
      
      setAuthError("Registration failed");
      return false;
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
      const success = await updateUserProfileUtil(user.id, profileData);
      
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
        return false;
      }
      
      // Then change to the new password
      const success = await changePasswordUtil(newPassword);
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
      const success = await updateUserProfileUtil(user.id, {
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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUserProfile: handleUpdateUserProfile,
    changePassword: handleChangePassword,
    uploadProfilePicture,
    updateUser,
    addCoins,
    authError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
