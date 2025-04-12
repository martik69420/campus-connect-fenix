import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  school?: string;
  createdAt?: string;
  updatedAt?: string;
  coins?: number;
  interests?: string[];
  isOnline?: boolean;
  location?: string;
  settings?: {
    privacy: {
      profileVisibility: string;
      onlineStatus: boolean;
      friendRequests: boolean;
      showActivity: boolean;
      allowMessages: string;
      allowTags: boolean;
      dataSharing: boolean;
      showEmail: boolean;
    };
  };
}

export interface ProfileUpdateData {
  displayName?: string;
  username?: string;
  bio?: string;
  school?: string;
  avatar?: string;
  interests?: string[];
  location?: string;
  settings?: {
    privacy: {
      profileVisibility: string;
      onlineStatus: boolean;
      friendRequests: boolean;
      showActivity: boolean;
      allowMessages: string;
      allowTags: boolean;
      dataSharing: boolean;
      showEmail: boolean;
    };
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
  authError: string | null;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
