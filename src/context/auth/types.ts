
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  school: string;
  avatar?: string;
  coins: number;
  createdAt?: string; // Add createdAt property
  bio?: string; // Add bio property
  friends?: string[]; // Add friends property
  location?: string; // Add location property
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  school?: string;
  avatar?: string;
  location?: string; // Add location property
}

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
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  validateCurrentPassword: (userId: string, password: string) => Promise<boolean>;
}
