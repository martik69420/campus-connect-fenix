import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast"; 
import { User, AuthContextType, ProfileUpdateData } from "./types";
import { loginUser, registerUser, changePassword, validateCurrentPassword, updateOnlineStatus, getCurrentUser, updateUserProfile } from "./authUtils";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./context";

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safely update online status
  const safeUpdateOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    if (!userId) return false;
    
    try {
      return await updateOnlineStatus(userId, isOnline);
    } catch (error) {
      console.error("Failed to update online status:", error);
      return false;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkExistingUser = async () => {
      try {
        // Try to get current user from Supabase session
        const currentUser = await getCurrentUser();
        
        if (currentUser && isMounted) {
          setUser(currentUser);
          
          // Update online status when session is restored
          await safeUpdateOnlineStatus(currentUser.id, true);
          
          // Set up interval to keep online status updated
          const interval = setInterval(() => {
            if (currentUser.id) {
              safeUpdateOnlineStatus(currentUser.id, true)
                .catch(err => console.error("Failed to update online status in interval:", err));
            }
          }, 5 * 60 * 1000); // Every 5 minutes
          
          return () => clearInterval(interval);
        } else {
          // Check localStorage as a fallback
          const storedUser = localStorage.getItem("fenixUser");
          if (storedUser && isMounted) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              
              // Update online status when session is restored from localStorage
              await safeUpdateOnlineStatus(parsedUser.id, true);
              
              // Set up interval to keep online status updated
              const interval = setInterval(() => {
                if (parsedUser.id) {
                  safeUpdateOnlineStatus(parsedUser.id, true)
                    .catch(err => console.error("Failed to update online status in interval:", err));
                }
              }, 5 * 60 * 1000); // Every 5 minutes
              
              return () => clearInterval(interval);
            } catch (error) {
              console.error("Failed to parse stored user:", error);
              localStorage.removeItem("fenixUser");
            }
          }
        }
      } catch (error) {
        console.error("Error checking existing user:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkExistingUser();
    
    return () => {
      isMounted = false;
    };
  }, [safeUpdateOnlineStatus]);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("fenixUser", JSON.stringify(user));
    }
  }, [user]);

  // Set up beforeunload event to update online status when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        // Update localStorage directly for better reliability on page unload
        localStorage.setItem('lastOfflineTime', new Date().toISOString());

        // Try to use sendBeacon if available
        try {
          const channel = supabase.channel('online-users');
          channel.untrack();
        } catch (error) {
          console.error("Error in beforeunload handler:", error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user) {
        safeUpdateOnlineStatus(user.id, false).catch(console.error);
      }
    };
  }, [user, safeUpdateOnlineStatus]);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const loggedInUser = await loginUser(username, password);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string, 
    email: string,
    displayName: string, 
    school: string, 
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await registerUser(username, email, displayName, school, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const handleUpdateUserProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await updateUserProfile(user.id, data);
      
      if (success) {
        // Update the local user state with new data
        setUser(prevUser => {
          if (!prevUser) return null;
          
          return {
            ...prevUser,
            displayName: data.displayName ?? prevUser.displayName,
            avatar: data.avatar ?? prevUser.avatar,
            bio: data.bio ?? prevUser.bio,
            school: data.school ?? prevUser.school,
            location: data.location ?? prevUser.location
          };
        });
        
        // Update localStorage to ensure consistency
        localStorage.setItem("fenixUser", JSON.stringify({
          ...user,
          displayName: data.displayName ?? user.displayName,
          avatar: data.avatar ?? user.avatar,
          bio: data.bio ?? user.bio,
          school: data.school ?? user.school,
          location: data.location ?? user.location
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  // Update password function
  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update password
      const success = await changePassword(user.id, newPassword);
      return success;
    } catch (error: any) {
      console.error("Error updating password:", error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    if (user) {
      try {
        // Update online status to offline
        await safeUpdateOnlineStatus(user.id, false);
      } catch (error) {
        console.error("Error updating online status during logout:", error);
      }
      
      setUser(null);
      localStorage.removeItem("fenixUser");
      
      // Sign out from Supabase auth if using it
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Error signing out from Supabase:", error);
      }
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      });
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Update localStorage to ensure consistency
      localStorage.setItem("fenixUser", JSON.stringify(updatedUser));
    }
  };

  // Add coins to user balance and update in database
  const addCoins = async (amount: number, reason?: string) => {
    if (user) {
      const newCoins = user.coins + amount;
      const updatedUser = { ...user, coins: newCoins };
      setUser(updatedUser);
      
      // Update localStorage to ensure consistency
      localStorage.setItem("fenixUser", JSON.stringify(updatedUser));
      
      // Update coins in database
      try {
        await supabase
          .from('profiles')
          .update({ coins: newCoins })
          .eq('id', user.id);
      } catch (error) {
        console.error("Error updating coins in database:", error);
      }
      
      toast({
        title: `+${amount} coins`,
        description: reason || "Coins added to your balance"
      });
    }
  };

  const authValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    addCoins,
    updatePassword,
    updateUserProfile: handleUpdateUserProfile,
    changePassword,
    validateCurrentPassword
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
