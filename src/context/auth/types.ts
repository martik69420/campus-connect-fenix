
// Define the User type
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coins: number;
  createdAt: string; // Changed from Date to string to match how we're using it
  email: string;
  school: string;
  friends: string[];
}

// Define the context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
}
