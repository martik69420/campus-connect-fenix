
// Define the User type
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coins: number;
  createdAt: string; // Using string instead of Date to avoid type conflicts
  email: string;
  school: string;
  bio?: string; // Added bio field that was causing errors
  friends: string[];
}

// Define the context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>; // Changed return type to match implementation
  logout: () => Promise<void>;
  register: (username: string, email: string, displayName: string, school: string, password: string) => Promise<boolean>; // Changed signature to match implementation
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateUserProfile: (userId: string, profileData: Partial<User>) => Promise<boolean>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  validateCurrentPassword: (userId: string, password: string) => Promise<boolean>;
}
