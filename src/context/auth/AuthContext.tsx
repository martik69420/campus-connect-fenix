
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, ProfileUpdateData } from './types';
import { createProfile, formatUser, generateUniqueUsername, sanitizeUsername, updateOnlineStatus, parseAuthError } from './authUtils';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Set up Supabase auth state listener
  useEffect(() => {
    console.info('Setting up auth listener');
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('Auth state changed:', event);
      setSession(session);
      
      if (session?.user) {
        setUser(formatUser(session.user));
        setIsAuthenticated(true);
        
        // Update online status
        updateOnlineStatus(session.user.id, true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    
    // Check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSession(session);
        setUser(formatUser(session.user));
        setIsAuthenticated(true);
        
        // Update online status
        updateOnlineStatus(session.user.id, true);
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
    
    // Set up beforeunload event to update online status when user leaves
    const handleBeforeUnload = () => {
      if (session?.user) {
        updateOnlineStatus(session.user.id, false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Register a new user
  const register = async (email: string, password: string, username: string, displayName: string, school: string): Promise<boolean> => {
    try {
      // Sanitize and ensure username is unique
      const sanitizedUsername = sanitizeUsername(username);
      const finalUsername = await generateUniqueUsername(sanitizedUsername || displayName);
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: finalUsername,
            displayName,
            school,
          },
        },
      });
      
      if (error) {
        console.error('Error in supabase.auth.signUp:', error);
        throw error;
      }
      
      if (data?.user) {
        // Create profile in the profiles table
        try {
          await createProfile(data.user.id, finalUsername, displayName, school);
          
          // Now log in the user
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (loginError) {
            console.error('Error logging in after registration:', loginError);
          }
          
          console.info('Login successful for user:', finalUsername);
          return true;
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          throw new Error('Account created but failed to set up profile');
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error in registerUser:', error);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.info('Attempting login for user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      if (data?.user) {
        console.info('Login successful for user:', data.user.email);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Update online status to offline
      if (session?.user) {
        await updateOnlineStatus(session.user.id, false);
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          displayName: data.displayName,
        },
      });
      
      if (authError) {
        throw authError;
      }
      
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          avatar_url: data.avatar,
          school: data.school,
          bio: data.bio,
        })
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Update local user state
      setUser((prev) => prev ? {
        ...prev,
        displayName: data.displayName || prev.displayName,
        avatar: data.avatar || prev.avatar,
        school: data.school || prev.school,
      } : null);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    session,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
