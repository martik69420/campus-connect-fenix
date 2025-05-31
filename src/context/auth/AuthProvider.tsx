
import React, { createContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { ProfileUpdateData, User } from './types';
import { checkIfProfileExists, createUserProfile } from './authUtils';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to convert profile data to User interface
  const convertProfileToUser = (profile: any, supabaseUser: SupabaseUser): User => {
    return {
      id: profile.id,
      username: profile.username || supabaseUser.email?.split('@')[0] || '',
      email: profile.email || supabaseUser.email || '',
      displayName: profile.display_name || supabaseUser.email?.split('@')[0] || '',
      avatar: profile.avatar_url || '/placeholder.svg',
      bio: profile.bio || '',
      school: profile.school || '',
      coins: profile.coins || 0,
      createdAt: profile.created_at || new Date().toISOString(),
      isAdmin: profile.is_admin || false,
      interests: profile.interests || [],
      location: profile.location || '',
      settings: profile.settings || {
        publicLikedPosts: true,
        publicSavedPosts: true,
        emailNotifications: true,
        pushNotifications: true,
        theme: 'light',
        privacy: {
          profileVisibility: 'everyone',
          onlineStatus: true,
          friendRequests: true,
          showActivity: true,
          allowMessages: 'everyone',
          allowTags: true,
          dataSharing: false,
          showEmail: false,
        }
      }
    };
  };

  // Function to fetch the user's profile from Supabase
  const fetchUserProfile = async (userId: string, supabaseUser: SupabaseUser) => {
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
        
        if (!profileExists && supabaseUser?.user_metadata) {
          console.log("Profile not found for user, attempting to create one");
          const created = await createUserProfile(
            userId, 
            supabaseUser.email, 
            supabaseUser.user_metadata
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
              const convertedUser = convertProfileToUser(newProfile, supabaseUser);
              setUser(convertedUser);
              return newProfile;
            }
          } else {
            console.error("Failed to create profile for user");
          }
        }
        
        return null;
      }

      setProfile(data);
      const convertedUser = convertProfileToUser(data, supabaseUser);
      setUser(convertedUser);
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

      const userProfile = await fetchUserProfile(session.user.id, session.user);
      setIsAuthenticated(true);
      return userProfile;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  // Function to update user profile
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!session?.user) return { error: { message: 'Not authenticated' } };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      await refreshUser();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { data };
    } catch (error: any) {
      setAuthError(error.message);
      return { error };
    }
  };

  // Register function
  const register = async (email: string, password: string, userData?: any) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { data };
    } catch (error: any) {
      setAuthError(error.message);
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

  // Alias for signOut to match interface
  const logout = signOut;

  // Additional methods to match the interface
  const updateUser = updateProfile;
  const updateUserProfile = updateProfile;

  const uploadProfilePicture = async (file: File) => {
    if (!session?.user) return { error: 'Not authenticated' };
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      
      return { success: true };
    } catch (error) {
      return { error };
    }
  };

  const addCoins = async (amount: number) => {
    if (!session?.user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coins: (profile?.coins || 0) + amount })
        .eq('id', session.user.id);

      if (error) throw error;

      await refreshUser();
      return { success: true };
    } catch (error) {
      return { error };
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
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            // Delay profile fetch to avoid potential recursive RLS issues
            setTimeout(async () => {
              const userProfile = await fetchUserProfile(newSession.user.id, newSession.user);
              setIsAuthenticated(!!userProfile);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setProfile(null);
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(session.user.id, session.user);
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
    authError,
    refreshUser,
    updateProfile,
    signOut,
    login,
    logout,
    register,
    updateUser,
    updateUserProfile,
    uploadProfilePicture,
    addCoins
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
