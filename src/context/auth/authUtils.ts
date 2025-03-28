import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/password-utils';
import { User } from '@/types';
import crypto from 'crypto';

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('users')
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
    createdAt: profile.created_at,
  };
};

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  displayName: string,
  school: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Validate username and email
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
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
      .from('users')
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
      createdAt: newUser.created_at,
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
      .from('users')
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
