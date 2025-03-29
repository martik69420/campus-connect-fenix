
import { supabase } from '@/integrations/supabase/client';
import type { User, ProfileUpdateData } from './types';

// Re-export these functions to be used by the AuthProvider
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error("Error getting session:", error);
      return null;
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profileData) {
      console.error("Error getting profile:", profileError);
      return null;
    }
    
    // Get user status data (online status, last active)
    const { data: statusData } = await supabase
      .from('user_status')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    // Map database fields to our User interface
    return {
      id: profileData.id,
      username: profileData.username,
      email: profileData.email,
      displayName: profileData.display_name,
      avatar: profileData.avatar_url,
      bio: profileData.bio,
      school: profileData.school,
      location: null, // We'll handle location in user_settings later
      createdAt: profileData.created_at,
      lastActive: statusData?.last_active || null,
      isOnline: statusData?.is_online || false,
      coins: profileData.coins || 0
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // First find the user's email using their username
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();
      
    if (userError || !userData || !userData.email) {
      console.error("Error finding user by username:", userError);
      return null;
    }
    
    // Now log in with the email and password
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password
    });
    
    if (error || !session) {
      console.error("Error logging in:", error);
      return null;
    }
    
    // Get the full user profile
    return await getCurrentUser();
  } catch (error) {
    console.error("Error in loginUser:", error);
    return null;
  }
};

export const registerUser = async (
  username: string, 
  email: string,
  displayName: string, 
  school: string, 
  password: string
): Promise<{ success: boolean; user: User | null }> => {
  try {
    // Check if username is already taken
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();
      
    if (existingUser) {
      console.error("Username already taken");
      return { success: false, user: null };
    }
    
    // Sign up with Supabase Auth
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError || !authUser) {
      console.error("Error signing up:", signUpError);
      return { success: false, user: null };
    }
    
    // Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        username,
        email,
        display_name: displayName,
        school,
        avatar_url: '',
        bio: '',
        coins: 100 // Starting coins
      });
      
    if (profileError) {
      console.error("Error creating profile:", profileError);
      return { success: false, user: null };
    }
    
    // Return the new user
    const newUser: User = {
      id: authUser.id,
      username,
      email,
      displayName,
      school,
      avatar: '',
      bio: '',
      createdAt: new Date().toISOString(),
      coins: 100
    };
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error in registerUser:", error);
    return { success: false, user: null };
  }
};

export const updateUserProfile = async (userId: string, data: ProfileUpdateData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.displayName,
        avatar_url: data.avatar,
        bio: data.bio,
        school: data.school,
        location: data.location
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return false;
  }
};

export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error("Error changing password:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in changePassword:", error);
    return false;
  }
};

export const validateCurrentPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    // Get user's email
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (error || !data || !data.email) {
      console.error("Error getting user email:", error);
      return false;
    }
    
    // Try to sign in with current credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password
    });
    
    // If no error, password is valid
    return !signInError;
  } catch (error) {
    console.error("Error validating password:", error);
    return false;
  }
};

export const updateOnlineStatus = async (userId: string, isOnline: boolean): Promise<boolean> => {
  try {
    // Check if user_status entry exists
    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    const updateData = {
      is_online: isOnline,
      last_active: new Date().toISOString(),
      user_id: userId
    };
    
    let error;
    
    if (existingStatus?.id) {
      // Update existing status
      const result = await supabase
        .from('user_status')
        .update({ is_online: isOnline, last_active: new Date().toISOString() })
        .eq('user_id', userId);
      
      error = result.error;
    } else {
      // Insert new status
      const result = await supabase
        .from('user_status')
        .insert(updateData);
      
      error = result.error;
    }
    
    if (error) {
      console.error("Error updating online status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateOnlineStatus:", error);
    return false;
  }
};
