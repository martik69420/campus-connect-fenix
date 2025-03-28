
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, comparePassword } from '@/lib/password-utils';
import { User } from './types';
import crypto from 'crypto';

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  if (!profile) {
    console.warn("No profile found for user ID:", user.id);
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    displayName: profile.display_name,
    school: profile.school,
    avatar: profile.avatar_url,
    coins: profile.coins,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  };
};

export const loginUser = async (
  username: string, 
  password: string
): Promise<User | null> => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      console.error("User not found:", error?.message);
      return null;
    }
    
    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      console.error("Invalid password");
      return null;
    }
    
    // Update online status when logging in
    updateOnlineStatus(user.id, true);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      school: user.school,
      avatar: user.avatar_url,
      coins: user.coins,
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    };
  } catch (error: any) {
    console.error("Login failed:", error.message);
    return null;
  }
};

export const registerUser = async (
  username: string,
  email: string,
  displayName: string,
  school: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Validate username and email
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (existingUsers && existingUsers.length > 0) {
      if (existingUsers.some((user) => user.username === username)) {
        return { success: false, error: 'Username already taken' };
      }
      if (existingUsers.some((user) => user.email === email)) {
        return { success: false, error: 'Email already in use' };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate UUID for user ID
    const userId = crypto.randomUUID();
    
    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        email: email,
        display_name: displayName,
        school: school,
        password_hash: hashedPassword,
        coins: 100,
        avatar_url: '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    const user: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.display_name,
      school: newUser.school,
      avatar: newUser.avatar_url,
      coins: newUser.coins,
      createdAt: newUser.created_at ? new Date(newUser.created_at) : new Date(),
    };

    return { success: true, user: user };
  } catch (error: any) {
    console.error("Registration failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: { displayName?: string; school?: string; avatar?: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        school: updates.school,
        avatar_url: updates.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Update profile failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Add the missing functions that are imported by AuthProvider
export const validateCurrentPassword = async (userId: string, currentPassword: string): Promise<boolean> => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('password_hash')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error("User not found:", error?.message);
      return false;
    }
    
    // Verify password
    const isValid = await comparePassword(currentPassword, user.password_hash);
    return isValid;
  } catch (error: any) {
    console.error("Password validation failed:", error.message);
    return false;
  }
};

export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update in the database
    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating password:", error.message);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error("Change password failed:", error.message);
    return false;
  }
};

export const updateOnlineStatus = async (userId: string, isOnline: boolean): Promise<boolean> => {
  try {
    // Check if the user already has a status entry
    const { data, error: checkError } = await supabase
      .from('user_status')
      .select('id')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking user status:", checkError.message);
      return false;
    }
    
    if (data && data.length > 0) {
      // Update existing status
      const { error } = await supabase
        .from('user_status')
        .update({ 
          is_online: isOnline,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error updating online status:", error.message);
        return false;
      }
    } else {
      // Insert new status
      const { error } = await supabase
        .from('user_status')
        .insert({ 
          user_id: userId, 
          is_online: isOnline,
          last_active: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error inserting online status:", error);
        return false;
      }
    }
    
    return true;
  } catch (error: any) {
    console.error("Update online status failed:", error.message);
    return false;
  }
};
