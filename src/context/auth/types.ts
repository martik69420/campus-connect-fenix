
export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  school: string;
  location?: string | null;
}

export interface ProfileUpdateData {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
  school?: string;
  location?: string | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
}
