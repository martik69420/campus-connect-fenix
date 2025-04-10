
export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  school: string;
  location?: string | null;
  coins?: number;
  createdAt?: string;
  lastActive?: string | null;
  isOnline?: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  username?: string; // Added username to the interface
  avatar?: string | null;
  bio?: string | null;
  school?: string;
  location?: string | null;
  website?: string | null; // Added website
  birthday?: string | null; // Added birthday
  availableForHire?: boolean; // Added availableForHire
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    email: string, 
    password: string, 
    username: string, 
    displayName: string,
    school: string
  ) => Promise<boolean>;
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
}
