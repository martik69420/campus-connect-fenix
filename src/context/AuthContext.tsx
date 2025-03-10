import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// User type definition
export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coins: number;
  inviteCode: string;
  createdAt: Date;
  school: string;
  bio?: string;
  friends: string[];
};

// Context type
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, inviteCode: string) => Promise<boolean>;
  register: (username: string, displayName: string, school: string, inviteCode: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for testing
const MOCK_USERS = [
  {
    id: "1",
    username: "john_doe",
    displayName: "John Doe",
    avatar: "/placeholder.svg",
    coins: 500,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    bio: "Computer Science student and tech enthusiast.",
    friends: ["2", "3"]
  },
  {
    id: "2",
    username: "jane_smith",
    displayName: "Jane Smith",
    avatar: "/placeholder.svg",
    coins: 750,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    bio: "Psychology major, love reading and coffee.",
    friends: ["1"]
  },
  {
    id: "3",
    username: "alex_johnson",
    displayName: "Alex Johnson",
    avatar: "/placeholder.svg",
    coins: 350,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    friends: ["1"]
  }
];

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("fenixUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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

  // Login function with password
  const login = async (username: string, password: string, inviteCode: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Verify invite code and find user
      if (inviteCode === "test") {
        // In a real app, you would use supabase auth here
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) throw error;
        if (!profile) {
          toast({
            title: "Login failed",
            description: "User not found",
            variant: "destructive",
          });
          return false;
        }

        // Verify password
        const { data: isValid } = await supabase
          .rpc('validate_password', {
            username,
            password
          });

        if (!isValid) {
          toast({
            title: "Login failed",
            description: "Invalid password",
            variant: "destructive",
          });
          return false;
        }

        setUser(profile as User);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${profile.display_name}`,
        });
        return true;
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
    return false;
  };

  // Register function with password
  const register = async (
    username: string, 
    displayName: string, 
    school: string, 
    inviteCode: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      if (inviteCode === "test") {
        // Check if username already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (existingUser) {
          toast({
            title: "Registration failed",
            description: "Username already taken",
            variant: "destructive",
          });
          return false;
        }

        // Create new user
        const newUser: User = {
          id: `user_${Date.now()}`,
          username,
          displayName,
          avatar: "/placeholder.svg",
          coins: 100,
          inviteCode: "test",
          createdAt: new Date(),
          school,
          friends: []
        };

        // Insert into profiles with password
        const { error } = await supabase
          .from('profiles')
          .insert({
            ...newUser,
            password_hash: password // In a real app, hash this!
          });

        if (error) throw error;
        
        setUser(newUser);
        toast({
          title: "Welcome to Campus Fenix!",
          description: "Your account has been created successfully.",
        });
        return true;
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
    return false;
  };

  // Update password function
  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: newPassword })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("fenixUser");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Add coins to user balance
  const addCoins = (amount: number, reason?: string) => {
    if (user) {
      const newCoins = user.coins + amount;
      setUser({ ...user, coins: newCoins });
      
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
