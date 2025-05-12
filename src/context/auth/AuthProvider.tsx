
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { ProfileUpdateData } from './types';
import { checkIfProfileExists, createUserProfile } from './authUtils';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch the user's profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Check if profile exists, if not create it
        const profileExists = await checkIfProfileExists(userId);
        
        if (!profileExists && user?.user_metadata) {
          console.log("Profile not found for user, attempting to create one");
          const created = await createUserProfile(
            userId, 
            user.email, 
            user.user_metadata
          );
          
          if (created) {
            // Fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (newProfile) {
              setProfile(newProfile);
              return newProfile;
            }
          } else {
            console.error("Failed to create profile for user");
          }
        }
        
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error("Error getting user profile:", err);
      return null;
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return null;
      }

      setUser(session.user);
      const userProfile = await fetchUserProfile(session.user.id);
      
      setIsAuthenticated(true);
      return userProfile;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  // Function to update user profile
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    try {
      // Convert settings to a JSON-compatible format if it exists
      const updatesToSend = {
        ...updates
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatesToSend)
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Set up auth state listener on mount
  useEffect(() => {
    console.log("Setting up auth listener");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            // Delay profile fetch to avoid potential recursive RLS issues
            setTimeout(async () => {
              const userProfile = await fetchUserProfile(newSession.user.id);
              setIsAuthenticated(!!userProfile);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(session.user.id);
          setIsAuthenticated(!!userProfile);
        } catch (error) {
          console.error("Error during initialization:", error);
        }
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth context value
  const value = {
    user,
    profile,
    session,
    isAuthenticated,
    isLoading,
    refreshUser,
    updateProfile,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
