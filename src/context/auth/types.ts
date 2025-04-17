
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  school: string;
  bio?: string;
  coins: number;
  isAdmin: boolean;
  interests: string[];
  location: string;
  createdAt: string;
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

export interface ProfileUpdateData {
  displayName?: string;
  username?: string;
  avatar?: string;
  school?: string;
  bio?: string;
  interests?: string[];
  settings?: UserSettings;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any;
  authError: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    displayName: string,
    school: string
  ) => Promise<boolean>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
