import * as React from "react";
import { AuthContext } from "./context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, AuthContextType, ProfileUpdateData } from "./types";
import { 
  loginUser, 
  registerUser, 
  changePassword as changePasswordUtil, 
  validateCurrentPassword, 
  updateOnlineStatus, 
  getCurrentUser, 
  updateUserProfile as updateUserProfileUtil 
} from "./authUtils";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Check for existing session and set up auth state listener
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session first
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            updateOnlineStatus(currentUser.id, true);
          } else {
            // User is logged in but doesn't have a profile - sign them out
            await supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event);
          if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
            try {
              const currentUser = await getCurrentUser();
              if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                updateOnlineStatus(currentUser.id, true);
              }
            } catch (error) {
              console.error("Error getting user:", error);
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      );
      
      return authListener;
    };

    // Run initialization and setup listener
    initializeAuth();
    const authListener = setupAuthListener();

    // Update online status when window focus changes
    const handleVisibilityChange = () => {
      if (user && document.visibilityState === "visible") {
        updateOnlineStatus(user.id, true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up beforeunload event to update status when user leaves
    window.addEventListener("beforeunload", () => {
      if (user) {
        // Use a synchronous method to update status before page unloads
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/update-status", false); // false makes it synchronous
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ userId: user.id, isOnline: false }));
      }
    });

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Attempt to login - loginUser will throw an error if login fails
      const user = await loginUser(identifier, password);
      
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.displayName || user.username}!`,
        });
        return true;
      }
      
      // This should not happen as loginUser should throw on failure
      toast({
        title: "Login failed",
        description: "Unknown error during login",
        variant: "destructive",
      });
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
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
      
      const result = await registerUser(email, password, username, displayName, school);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        toast({
          title: "Registration successful",
          description: `Welcome to Campus Fenix, ${displayName}!`,
        });
        return true;
      }
      
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred during registration",
        variant: "destructive",
      });
      return false;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
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
      if (error) throw error;
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
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
        toast({
          title: "Password change failed",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        return false;
      }
      
      // Then change to the new password
      const success = await changePasswordUtil(newPassword);
      
      if (success) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully",
        });
      }
      
      return success;
    } catch (error: any) {
      console.error("Password change error:", error);
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload a profile picture",
          variant: "destructive",
        });
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
        
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        });
        
        return avatarUrl;
      }
      
      return null;
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
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
      
      // Instead of trying to insert into a non-existent table, just log the transaction
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
    addCoins
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
