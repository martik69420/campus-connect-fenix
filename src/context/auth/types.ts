
// User interface that matches Supabase structure
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  school?: string;
  location?: string;
  createdAt?: string;
  lastActive?: string;
  isOnline?: boolean;
  coins: number;
}

// Profile update data structure
export interface ProfileUpdateData {
  displayName?: string;
  avatar?: string;
  bio?: string;
  school?: string;
  location?: string;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    displayName: string,
    school: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  validateCurrentPassword: (userId: string, password: string) => Promise<boolean>;
}
