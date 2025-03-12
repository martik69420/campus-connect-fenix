
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

// User type definition
export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  coins: number;
  inviteCode?: string;
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
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, displayName: string, school: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map Supabase profile to our User model
const mapProfileToUser = (profile: any): User => {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email || "",
    displayName: profile.display_name,
    avatar: profile.avatar_url || "/placeholder.svg",
    coins: profile.coins || 0,
    inviteCode: profile.invite_code,
    createdAt: safeParseDate(profile.created_at),
    school: profile.school || "",
    bio: profile.bio || "",
    friends: []
  };
};

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
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Find user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error("Login error:", error);
        throw error;
      }
      
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

      // Map profile to our User model
      const mappedUser = mapProfileToUser(profile);
      setUser(mappedUser);
      
      console.log("User logged in successfully:", mappedUser);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${profile.display_name}`,
      });
      return true;
    } catch (error: any) {
      console.error("Login error details:", error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
    return false;
  };

  // Register function - updated to include email and proper Supabase registration
  const register = async (
    username: string, 
    email: string,
    displayName: string, 
    school: string, 
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log("Attempting to register user:", { username, email, displayName, school });
      
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // If error is not "no rows returned", it's a real error
        console.error("Check username error:", checkError);
        throw checkError;
      }

      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "Username already taken",
          variant: "destructive",
        });
        return false;
      }

      // Create new user directly in profiles table
      const userId = crypto.randomUUID(); // Generate a UUID for the new user
      
      const newUserData = {
        id: userId,
        username,
        email,
        display_name: displayName,
        avatar_url: "/placeholder.svg",
        coins: 100,
        invite_code: "", // Required field in the profiles table
        school,
        password_hash: password, // In a real app, hash this!
        bio: ""
      };

      console.log("Creating new user profile:", newUserData);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(newUserData);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw profileError;
      }
      
      // Create our User model
      const newUser: User = {
        id: newUserData.id,
        username: newUserData.username,
        email: newUserData.email,
        displayName: newUserData.display_name,
        avatar: newUserData.avatar_url,
        coins: newUserData.coins,
        inviteCode: newUserData.invite_code,
        createdAt: new Date(),
        school: newUserData.school,
        bio: newUserData.bio,
        friends: []
      };
      
      console.log("User registered successfully:", newUser);
      
      setUser(newUser);
      toast({
        title: "Welcome to Campus Fenix!",
        description: "Your account has been created successfully.",
      });
      return true;
    } catch (error: any) {
      console.error("Registration error details:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
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
