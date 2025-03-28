
import { supabase } from "@/integrations/supabase/client";

// Helper function to safely parse dates
export const safeParseDate = (dateString: string | null): Date => {
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
export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, displayName: string, school: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  // Added these functions to the type
  updateUserProfile: (userId: string, updates: { displayName?: string; school?: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  validateCurrentPassword: (userId: string, currentPassword: string) => Promise<boolean>;
};

// Helper function to map Supabase profile to our User model
export const mapProfileToUser = (profile: any): User => {
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
