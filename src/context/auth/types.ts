
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  school: string;
  coins: number;
  createdAt: string;
  isAdmin: boolean;
  interests?: string[];
  location?: string;
  settings: UserSettings;
}

export interface UserSettings {
  publicLikedPosts: boolean;
  publicSavedPosts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
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
}

// This interface should match what the Supabase database expects
export interface ProfileUpdateData {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  school?: string;
  bio?: string;
  interests?: string[];
  settings?: Record<string, any>; // Changed from UserSettings to make it compatible with Json type
  location?: string;
}

// Simplified AuthContextType to match what's actually implemented
export interface AuthContextType {
  user: User | null;
  profile: any | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<any>;
  updateProfile: (updates: ProfileUpdateData) => Promise<any>;
  signOut: () => Promise<void>;
}
