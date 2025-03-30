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
    
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();  // Change from .single() to .maybeSingle() to handle potential missing profiles
    
    if (profileError) {
      console.error("Error getting profile:", profileError);
      return null;
    }
    
    // If profile doesn't exist, create one
    if (!profileData) {
      // Create a new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          email: session.user.email,
          display_name: session.user.email?.split('@')[0] || 'User',
          school: 'Not specified',
          avatar_url: '',
          bio: '',
          coins: 100 // Starting coins
        });
        
      if (insertError) {
        console.error("Error creating profile:", insertError);
        return null;
      }
      
      // Fetch the newly created profile
      const { data: newProfileData, error: newProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (newProfileError || !newProfileData) {
        console.error("Error getting new profile:", newProfileError);
        return null;
      }
      
      profileData = newProfileData;
    }
    
    // Get user status data (online status, last active)
    const { data: statusData } = await supabase
      .from('user_status')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    // Map database fields to our User interface
    return {
      id: profileData.id,
      username: profileData.username,
      email: profileData.email,
      displayName: profileData.display_name,
      avatar: profileData.avatar_url,
      bio: profileData.bio,
      school: profileData.school,
      location: null, // Not in database, set to null
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

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // Check if the input is an email or username
    let userEmail = email;
    
    // If it doesn't look like an email, assume it's a username and get the email
    if (!email.includes('@')) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email)
        .single();
        
      if (userError || !userData || !userData.email) {
        console.error("Error finding user by username:", userError);
        throw new Error("User not found with that username");
      }
      
      userEmail = userData.email;
    }
    
    // Now log in with the email and password
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password
    });
    
    if (error || !session) {
      console.error("Error logging in:", error);
      throw error;
    }
    
    // Get the full user profile
    return await getCurrentUser();
  } catch (error) {
    console.error("Error in loginUser:", error);
    throw error;
  }
};

export const registerUser = async (
  email: string, 
  password: string,
  username: string, 
  displayName: string, 
  school: string
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
      location: null,
      createdAt: new Date().toISOString(),
      lastActive: null,
      isOnline: true,
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
    const updateData: any = {};
    
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.avatar !== undefined) updateData.avatar_url = data.avatar;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.school !== undefined) updateData.school = data.school;
    // Don't include location as it doesn't exist in the database
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
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

export const changePassword = async (newPassword: string): Promise<boolean> => {
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

export const validateCurrentPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    // Try to sign in with current credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
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

export const blockUser = async (userId: string, blockedUserId: string): Promise<boolean> => {
  try {
    // Check if block already exists
    const { data: existingBlock, error: checkError } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing block:", checkError);
      return false;
    }
    
    // If block already exists, return success
    if (existingBlock) {
      return true;
    }
    
    // Create new block
    const { error } = await supabase
      .from('user_blocks')
      .insert({
        user_id: userId,
        blocked_user_id: blockedUserId
      });
      
    if (error) {
      console.error("Error blocking user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in blockUser:", error);
    return false;
  }
};

export const unblockUser = async (userId: string, blockedUserId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);
      
    if (error) {
      console.error("Error unblocking user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in unblockUser:", error);
    return false;
  }
};

export const getBlockedUsers = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error getting blocked users:", error);
      return [];
    }
    
    return data.map(block => block.blocked_user_id);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    return [];
  }
};

export const isUserBlocked = async (userId: string, otherUserId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('user_id', userId)
      .eq('blocked_user_id', otherUserId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error("Error checking if user is blocked:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in isUserBlocked:", error);
    return false;
  }
};
