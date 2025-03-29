
import React from 'react';
import type { AuthContextType } from './types';

// Create context with a default value
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  updateUser: () => {},
  addCoins: async () => {},
  updatePassword: async () => false,
  updateUserProfile: async () => false,
  changePassword: async () => false,
  validateCurrentPassword: async () => false
});
