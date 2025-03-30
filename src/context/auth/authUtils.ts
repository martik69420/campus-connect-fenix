import { supabase } from '@/integrations/supabase/client';
import type { User, ProfileUpdateData } from './types';

// Get the current user session and profile data
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Get user profile data
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error getting profile:", profileError);
      return null;
    }
    
    if (!profileData) {
      console.log("No profile found for user:", session.user.id);
      return null;
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
      location: null,
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

// Secure login function that properly validates credentials
export const loginUser = async (identifier: string, password: string): Promise<User | null> => {
  try {
    console.log(`Attempting login for user: ${identifier}`);
    
    // Check if input is email or username
    let userEmail = identifier;
    
    // If it doesn't look like an email, find the email by username
    if (!identifier.includes('@')) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .maybeSingle();
        
      if (userError) {
        console.error("Error finding user by username:", userError);
        throw new Error("Error looking up user account");
      }
      
      if (!userData || !userData.email) {
        console.error("User not found with username:", identifier);
        throw new Error("No account found with that username");
      }
      
      userEmail = userData.email;
    }
    
    // Use signInWithPassword to securely validate credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password
    });
    
    if (error) {
      console.error("Login authentication failed:", error);
      throw new Error(error.message || "Invalid login credentials");
    }
    
    if (!data.session) {
      console.error("No session returned after login");
      throw new Error("Authentication failed");
    }
    
    // Get the complete user profile after successful authentication
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Successfully authenticated but failed to retrieve user profile");
    }
    
    console.log("Login successful for user:", user.username);
    return user;
  } catch (error: any) {
    console.error("Login process failed:", error);
    throw error;
  }
};

// Register a new user with complete profile
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
      .maybeSingle();
      
    if (existingUser) {
      console.error("Username already taken");
      throw new Error("This username is already taken. Please choose another one.");
    }
    
    // Sign up with Supabase Auth
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError || !authUser) {
      console.error("Error signing up:", signUpError);
      throw new Error(signUpError?.message || "Registration failed");
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
      throw new Error("Account created but failed to set up profile");
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
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    throw error;
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
