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
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  addCoins: (amount: number, description: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export interface UserSettings {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  showLikedPosts?: boolean; // Added setting to control liked posts visibility
  showActivityStatus?: boolean;
  profilePrivacy?: 'public' | 'friends' | 'private';
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  school?: string;
  location?: string;
  website?: string;
  settings?: Partial<UserSettings>; // Allow updating settings
}
