
// This file re-exports the context and provider from the auth folder
import { AuthContext, AuthProvider } from './auth';
import { useAuth } from './auth/hooks';
import type { User, AuthContextType } from './auth/types';

export { AuthContext, AuthProvider, useAuth };
export type { User, AuthContextType };
