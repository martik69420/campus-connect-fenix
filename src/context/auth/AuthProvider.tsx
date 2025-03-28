import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, AuthContextType } from "./types";
import { loginUser, registerUser, changePassword, validateCurrentPassword, updateOnlineStatus } from "./authUtils";
import { supabase } from "@/integrations/supabase/client";

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("fenixUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Update online status when session is restored
        updateOnlineStatus(parsedUser.id, true);
        
        // Set up interval to keep online status updated
        const interval = setInterval(() => {
          updateOnlineStatus(parsedUser.id, true);
        }, 5 * 60 * 1000); // Every 5 minutes
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("fenixUser");
      }
    }
    setIsLoading(false);
  }, []);

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
        updateOnlineStatus(user.id, false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };
  }, [user]);

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
      const newUser = await registerUser(username, email, displayName, school, password);
      
      if (newUser) {
        setUser(newUser);
        return true;
      }
      
      return false;
    } finally {
      setIsLoading(false);
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
      // Update online status to offline
      await updateOnlineStatus(user.id, false);
      
      setUser(null);
      localStorage.removeItem("fenixUser");
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
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

  // Add coins to user balance
  const addCoins = (amount: number, reason?: string) => {
    if (user) {
      const newCoins = user.coins + amount;
      const updatedUser = { ...user, coins: newCoins };
      setUser(updatedUser);
      
      // Update localStorage to ensure consistency
      localStorage.setItem("fenixUser", JSON.stringify(updatedUser));
      
      toast({
        title: `+${amount} coins`,
        description: reason || "Coins added to your balance",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        addCoins,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
