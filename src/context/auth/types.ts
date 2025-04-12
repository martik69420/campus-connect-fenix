
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
