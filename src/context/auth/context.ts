
import { createContext } from 'react';
import type { AuthContextType } from './types';

// Create context with a default value
export const AuthContext = createContext<AuthContextType | null>(null);
