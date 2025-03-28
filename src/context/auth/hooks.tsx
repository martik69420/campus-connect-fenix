
import * as React from 'react';
import { AuthContext } from './context';
import type { AuthContextType } from './types';

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
