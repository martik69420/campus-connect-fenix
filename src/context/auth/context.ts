
import { createContext, useContext } from 'react';
import type { AuthContextType } from './types';

// Create context with a default value
export const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
