
import React from 'react';
import { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio?: string | null;
  school?: string | null;
  location?: string | null;
  website?: string | null;
  coins: number;
  createdAt: string;
  settings?: UserSettings;
  lastActive?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, description: string) => Promise<boolean>;
  authError: string | null;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface UserSettings {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  showLikedPosts?: boolean;
  showSavedPosts?: boolean;
  showEmail?: boolean;
  showSchool?: boolean;
  showLocation?: boolean;
  showActivityStatus?: boolean;
  profilePrivacy?: 'public' | 'friends' | 'private';
  showFriendsList?: boolean;
  readReceipts?: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  school?: string;
  location?: string;
  website?: string;
  settings?: Partial<UserSettings>;
  interests?: string[];
}
