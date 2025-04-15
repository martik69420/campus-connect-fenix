import { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  school: string;
  bio?: string;
  coins: number;
  level?: number;
  isAdmin: boolean;
  interests?: string[];
  location?: string;
  createdAt?: string;
  settings?: {
    privacy?: {
      profileVisibility?: string;
      onlineStatus?: boolean;
      friendRequests?: boolean;
      showActivity?: boolean;
      allowMessages?: string;
      allowTags?: boolean;
      dataSharing?: boolean;
      showEmail?: boolean;
    };
    publicLikedPosts?: boolean;
    publicSavedPosts?: boolean;
    theme?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

export interface ProfileUpdateData {
  displayName?: string;
  username?: string;
  avatar?: string;
  school?: string;
  bio?: string;
  interests?: string[];
  settings?: {
    privacy?: {
      profileVisibility?: string;
      onlineStatus?: boolean;
      friendRequests?: boolean;
      showActivity?: boolean;
      allowMessages?: string;
      allowTags?: boolean;
      dataSharing?: boolean;
      showEmail?: boolean;
    };
    publicLikedPosts?: boolean;
    publicSavedPosts?: boolean;
    theme?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Additional methods needed by components
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
}
