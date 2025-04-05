
import { createContext, useContext } from 'react';
import type { AuthContextType } from './types';

// Create the Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using the Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export the AuthProvider
export { AuthProvider } from './AuthProvider';
export type { User, ProfileUpdateData } from './types';
