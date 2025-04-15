import { supabase } from '@/integrations/supabase/client';
import { User } from './types';

// Function to create user profile in the public.profiles table
export async function createProfile(userId: string, username: string, displayName: string, school: string = 'Unknown School', avatarUrl: string = '/placeholder.svg') {
  try {
    // Check if profile already exists to prevent duplication
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    // If profile already exists, just return success
    if (existingProfile) {
      console.log('Profile already exists, skipping creation');
      return true;
    }
    
    // Create new profile
    const { error } = await supabase.from('profiles').insert([
      {
        id: userId,
        username, 
        display_name: displayName,
        school,
        avatar_url: avatarUrl,
        coins: 100, // Starting coins
        settings: {
          publicLikedPosts: false,
          publicSavedPosts: false,
          emailNotifications: true,
          pushNotifications: true,
          theme: 'system'
        }
      }
    ]);
    
    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

// Sanitize username - remove non-alphanumeric characters, replace spaces with underscores
export function sanitizeUsername(input: string): string {
  // Remove special characters, leave alphanumeric, dash, underscore
  let sanitized = input.toLowerCase().replace(/[^\w-]/g, '');
  
  // Ensure it starts with a letter or number
  if (!/^[a-z0-9]/.test(sanitized) && sanitized.length > 0) {
    sanitized = 'user_' + sanitized;
  }
  
  // If empty after sanitization, generate a random username
  if (!sanitized) {
    const randomString = Math.random().toString(36).substring(2, 10);
    sanitized = 'user_' + randomString;
  }
  
  return sanitized;
}

// Format user data from Supabase auth to our app's User type
export function formatUser(authUser: any): User | null {
  if (!authUser) return null;
  
  return {
    id: authUser.id,
    email: authUser.email || '',
    username: authUser.user_metadata?.username || '',
    displayName: authUser.user_metadata?.displayName || authUser.user_metadata?.name || '',
    avatar: authUser.user_metadata?.avatar_url || '/placeholder.svg',
    school: authUser.user_metadata?.school || 'Unknown School',
    coins: authUser.user_metadata?.coins || 0,
    level: authUser.user_metadata?.level || 1,
    isAdmin: authUser.user_metadata?.isAdmin || false,
  };
}

// Function to check if a username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .limit(1);
      
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false; // Assume username is taken if there's an error
  }
}

// Generate a unique username based on the given name
export async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = sanitizeUsername(baseName);
  let isAvailable = await isUsernameAvailable(username);
  let attempts = 0;
  const maxAttempts = 5;
  
  // Try adding numbers if the username is taken
  while (!isAvailable && attempts < maxAttempts) {
    const randomSuffix = Math.floor(Math.random() * 1000);
    username = `${sanitizeUsername(baseName)}${randomSuffix}`;
    isAvailable = await isUsernameAvailable(username);
    attempts++;
  }
  
  // If we still can't find an available username, use a more random one
  if (!isAvailable) {
    username = `user_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  return username;
}

// Update online status for a user
export async function updateOnlineStatus(userId: string, isOnline: boolean) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString(), is_online: isOnline })
      .eq('id', userId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating online status:', error);
    return false;
  }
}

// Parse error messages from Supabase auth errors
export function parseAuthError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  // Common Supabase auth error messages
  const errorMsg = error.message || 'An unexpected error occurred';
  
  if (errorMsg.includes('Email already in use')) {
    return 'This email is already registered. Please use a different email or try logging in.';
  }
  
  if (errorMsg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorMsg.includes('Email not confirmed')) {
    return 'Please confirm your email address before logging in.';
  }
  
  return errorMsg;
}

// Other utility functions can be added here
