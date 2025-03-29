
import React from 'react';
// This file re-exports the context and provider from the auth folder
import { AuthContext, AuthProvider, useAuth } from './auth';
import type { User, AuthContextType } from './auth/types';

export { AuthContext, AuthProvider, useAuth };
export type { User, AuthContextType };

