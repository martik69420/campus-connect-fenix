
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  location?: string;
  school?: string;
  website?: string;
  interests?: string[];
  coins?: number;
  lastActive?: string;
  isOnline?: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  school?: string;
  website?: string;
  interests?: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  authError: string | null;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}
