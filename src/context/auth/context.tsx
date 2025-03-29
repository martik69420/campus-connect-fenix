
import * as React from 'react';
import type { AuthContextType } from './types';

// Create context with a default value
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
