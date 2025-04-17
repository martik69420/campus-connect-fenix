import { supabase } from '@/integrations/supabase/client';
import { User, ProfileUpdateData, UserSettings } from './types';

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
          theme: 'system',
          privacy: {
            profileVisibility: 'everyone',
            onlineStatus: true,
            friendRequests: true,
            showActivity: true,
            allowMessages: 'everyone',
            allowTags: true,
            dataSharing: false,
            showEmail: false
          }
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

// Helper function to parse settings object from database
function parseUserSettings(settingsData: any): UserSettings {
  // Default settings if none exist
  const defaultSettings: UserSettings = {
    publicLikedPosts: false,
    publicSavedPosts: false,
    emailNotifications: true,
    pushNotifications: true,
    theme: 'system',
    privacy: {
      profileVisibility: 'everyone',
      onlineStatus: true,
      friendRequests: true,
      showActivity: true,
      allowMessages: 'everyone',
      allowTags: true,
      dataSharing: false,
      showEmail: false
    }
  };

  // If settings is null or not an object, return defaults
  if (!settingsData || typeof settingsData !== 'object' || Array.isArray(settingsData)) {
    return defaultSettings;
  }

  // Otherwise merge with defaults to ensure type safety
  return {
    ...defaultSettings,
    ...settingsData,
    privacy: {
      ...defaultSettings.privacy,
      ...(settingsData.privacy || {})
    }
  };
}

// Format user data from Supabase auth to our app's User type
export function formatUser(authUser: any, profileData?: any): User | null {
  if (!authUser) return null;
  
  const profile = profileData || authUser.user_metadata || {};
  
  return {
    id: authUser.id,
    email: authUser.email || '',
    username: profile.username || sanitizeUsername(authUser.email?.split('@')[0] || ''),
    displayName: profile.display_name || profile.displayName || authUser.email?.split('@')[0] || '',
    avatar: profile.avatar_url || '/placeholder.svg',
    school: profile.school || 'Unknown School',
    bio: profile.bio || '',
    coins: profile.coins || 0,
    isAdmin: profile.is_admin || false,
    interests: profile.interests || [],
    location: profile.location || '',
    createdAt: profile.created_at || authUser.created_at || new Date().toISOString(),
    settings: parseUserSettings(profile.settings)
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
      .update({ 
        is_online: isOnline,
        updated_at: new Date().toISOString()
      })
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
    return 'Please confirm your email address before logging in. Check your inbox for a confirmation link.';
  }
  
  return errorMsg;
}

// Login user with username or email
export async function loginUser(usernameOrEmail: string, password: string): Promise<User | null> {
  try {
    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    
    if (isEmail) {
      // Sign in with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail,
        password,
      });
      
      if (error) {
        console.error('Login authentication failed:', error);
        throw error;
      }
      
      if (data?.user) {
        // Get user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.warn('Could not find profile, attempting to create one');
          const username = sanitizeUsername(data.user.email?.split('@')[0] || '');
          const displayName = data.user.email?.split('@')[0] || '';
          await createProfile(data.user.id, username, displayName);
          
          // Try to get the profile again
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          return formatUser(data.user, newProfile);
        }
        
        return formatUser(data.user, profileData);
      }
      
      return null;
    } else {
      // Sign in with username
      // First get the email for this username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail)
        .single();
        
      if (profileError || !profileData?.email) {
        console.error('Login error: Username not found', profileError);
        throw new Error('Invalid username or password');
      }
      
      // Then sign in with the found email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      
      if (error) {
        console.error('Login authentication failed:', error);
        throw new Error('Invalid username or password');
      }
      
      if (data?.user) {
        // Get user profile data
        const { data: completeProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        return formatUser(data.user, completeProfile);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Login process failed:', error);
    throw error;
  }
}

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
  school: string
) {
  try {
    // Check if username is already taken
    const isUsernameValid = await isUsernameAvailable(username);
    if (!isUsernameValid) {
      throw new Error('Username is already taken. Please choose another one.');
    }
    
    // Register with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          displayName,
          school,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    
    if (error) {
      throw error;
    }
    
    if (data?.user) {
      try {
        await createProfile(data.user.id, username, displayName, school);
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          username: username,
          displayName: displayName,
          avatar: '/placeholder.svg',
          school: school,
          coins: 100, // Starting coins
          isAdmin: false,
          interests: [],
          location: '',
          createdAt: new Date().toISOString(),
          settings: {
            publicLikedPosts: false,
            publicSavedPosts: false,
            emailNotifications: true,
            pushNotifications: true,
            theme: 'system',
            privacy: {
              profileVisibility: 'everyone',
              onlineStatus: true,
              friendRequests: true,
              showActivity: true,
              allowMessages: 'everyone',
              allowTags: true,
              dataSharing: false,
              showEmail: false
            }
          }
        };
        
        return { success: true, user };
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Account created but failed to set up profile');
      }
    }
    
    return { success: false, user: null };
  } catch (error) {
    console.error('Error in registerUser:', error);
    throw error;
  }
}

// Get current logged in user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    // Get user profile data from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error || !profile) {
      console.warn('Profile not found for user, attempting to create one');
      
      const username = sanitizeUsername(session.user.email?.split('@')[0] || '');
      const displayName = session.user.email?.split('@')[0] || '';
      
      await createProfile(session.user.id, username, displayName);
      
      // Try to get the profile again
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (newProfile) {
        return formatUser(session.user, newProfile);
      }
      
      return null;
    }
    
    // Create User object from session and profile data
    return formatUser(session.user, profile);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, data: ProfileUpdateData): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.avatar !== undefined) updateData.avatar_url = data.avatar;
    if (data.school !== undefined) updateData.school = data.school;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (data.settings !== undefined) updateData.settings = data.settings;
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

// Validate current password
export async function validateCurrentPassword(email: string, password: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return !error;
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
}

// Change password
export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    return false;
  }
}
