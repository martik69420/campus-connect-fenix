
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

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
  login: (username: string, inviteCode: string) => Promise<boolean>;
  register: (username: string, displayName: string, school: string, inviteCode: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
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

  // Login function
  const login = async (username: string, inviteCode: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify invite code and find user
    if (inviteCode === "test") {
      const foundUser = MOCK_USERS.find(u => u.username === username);
      if (foundUser) {
        setUser(foundUser);
        setIsLoading(false);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${foundUser.displayName}`,
        });
        return true;
      }
    }
    
    setIsLoading(false);
    toast({
      title: "Login failed",
      description: "Invalid username or invite code",
      variant: "destructive",
    });
    return false;
  };

  // Register function
  const register = async (
    username: string, 
    displayName: string, 
    school: string, 
    inviteCode: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify invite code
    if (inviteCode === "test") {
      // Check if username already exists
      if (MOCK_USERS.some(u => u.username === username)) {
        setIsLoading(false);
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
        inviteCode: "test", // Give them the same invite code
        createdAt: new Date(),
        school,
        friends: []
      };
      
      // In a real app, you would save to a database here
      setUser(newUser);
      setIsLoading(false);
      toast({
        title: "Welcome to Campus Fenix!",
        description: "Your account has been created successfully.",
      });
      return true;
    }
    
    setIsLoading(false);
    toast({
      title: "Registration failed",
      description: "Invalid invite code",
      variant: "destructive",
    });
    return false;
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
        addCoins
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
