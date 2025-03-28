
import { supabase } from '@/integrations/supabase/client';
import { User } from './types';

// Login user
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();
    
    if (userError || !existingUser) {
      console.error('User not found:', userError);
      return null;
    }
    
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: existingUser.email,
      password,
    });

    if (error || !user) {
      console.error('Login error:', error);
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    // Create user object with required format
    const userData: User = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar_url || '',
      coins: profile.coins || 0,
      createdAt: profile.created_at || new Date().toISOString(), // Using string
      email: profile.email,
      school: profile.school || '',
      bio: profile.bio || '',
      friends: profile.friends || [],
    };

    // Update online status
    await updateOnlineStatus(userData.id, true);
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

// Register user
export const registerUser = async (
  username: string,
  email: string,
  displayName: string,
  school: string,
  password: string
): Promise<{ success: boolean; user: User | null; message?: string }> => {
  try {
    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return { success: false, user: null, message: 'Username already taken' };
    }

    // Register user with Supabase Auth
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !user) {
      console.error('Registration error:', error);
      return { success: false, user: null, message: error?.message };
    }

    // Create profile in the profiles table
    const newProfile = {
      id: user.id,
      username,
      display_name: displayName,
      email,
      school,
      avatar_url: '',
      coins: 100, // Starting coins
      created_at: new Date().toISOString(), // Using string
      bio: '',
      friends: []
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(newProfile);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { success: false, user: null, message: profileError.message };
    }

    // Create user status entry
    await supabase
      .from('user_status')
      .insert({
        user_id: user.id,
        is_online: true,
        last_active: new Date().toISOString()
      });

    // Create user settings entry with default values
    await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        notifications_enabled: true,
        language: 'en'
      });

    // Create formatted user object
    const userData: User = {
      id: user.id,
      username,
      displayName,
      avatar: '',
      coins: 100,
      createdAt: new Date().toISOString(), // Using string
      email,
      school,
      bio: '',
      friends: []
    };

    return { success: true, user: userData };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, user: null, message: (error as Error).message };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error || !profile) {
      console.error('Profile fetch error:', error);
      return null;
    }
    
    // Create user object
    const userData: User = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar_url || '',
      coins: profile.coins || 0,
      createdAt: profile.created_at || new Date().toISOString(), // Using string
      email: profile.email,
      school: profile.school || '',
      bio: profile.bio || '',
      friends: profile.friends || []
    };
    
    return userData;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Update online status
export const updateOnlineStatus = async (userId: string, isOnline: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_status')
      .upsert(
        { 
          user_id: userId, 
          is_online: isOnline,
          last_active: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );
      
    return !error;
  } catch (error) {
    console.error('Update online status error:', error);
    return false;
  }
};

// Change password
export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    return !error;
  } catch (error) {
    console.error('Change password error:', error);
    return false;
  }
};

// Validate current password
export const validateCurrentPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('User email fetch error:', userError);
      return false;
    }
    
    // Try to sign in with current password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password
    });
    
    // If login successful, password is valid
    return !!data.user && !error;
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, profileData: Partial<User>): Promise<boolean> => {
  try {
    // Format the data for the profiles table
    const formattedData: Record<string, any> = {};
    
    if (profileData.displayName) formattedData.display_name = profileData.displayName;
    if (profileData.username) formattedData.username = profileData.username;
    if (profileData.avatar) formattedData.avatar_url = profileData.avatar;
    if (profileData.school) formattedData.school = profileData.school;
    if (profileData.bio) formattedData.bio = profileData.bio;
    
    // Only update if there's data to update
    if (Object.keys(formattedData).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(formattedData)
        .eq('id', userId);
        
      if (error) {
        console.error('Profile update error:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Update user profile error:', error);
    return false;
  }
};
