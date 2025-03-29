import { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { comparePassword, hashPassword } from '@/lib/password-utils';
import { Database } from '@/integrations/supabase/types';
import { ProfileUpdateData } from './types';
import { supabase } from '@/integrations/supabase/client';

type User = Database['public']['Tables']['profiles']['Row'];
type UserAttributes = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export async function getSession({ supabase }: { supabase: SupabaseClient }) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

export async function getProfile({
  supabase,
  session,
}: {
  supabase: SupabaseClient;
  session: Session | null;
}) {
  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session?.user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return profile;
}

export async function subscribeToAuthChanges({
  supabase,
  callback,
}: {
  supabase: SupabaseClient;
  callback: (event: AuthChangeEvent, session: Session | null) => void;
}) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function updateProfile({
  supabase,
  user,
  attributes,
}: {
  supabase: SupabaseClient;
  user: Session['user'];
  attributes: UserAttributes;
}) {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    ...attributes,
  });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function signOut({ supabase }: { supabase: SupabaseClient }) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Adding the missing exports that AuthProvider.tsx is trying to import

export async function loginUser(username: string, password: string) {
  try {
    // Implement login logic here
    // This is a placeholder implementation
    console.log('Login attempt for:', username);
    // In a real implementation, this would validate credentials against the database
    
    // For demo purposes, return a mock user
    return {
      id: 'user-123',
      username: username,
      email: `${username}@example.com`,
      displayName: username,
      school: 'Demo School',
      coins: 100
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function registerUser(
  username: string,
  email: string,
  displayName: string,
  school: string,
  password: string
) {
  try {
    // Implement registration logic here
    // This is a placeholder implementation
    console.log('Registration attempt for:', username);
    
    // For demo purposes, return success with a mock user
    return {
      success: true,
      user: {
        id: 'user-123',
        username,
        email,
        displayName,
        school,
        coins: 0
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, user: null };
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    // Implement password change logic here
    console.log('Changing password for user:', userId);
    // In a real implementation, this would update the password in the database
    
    return true;
  } catch (error) {
    console.error('Password change error:', error);
    return false;
  }
}

export async function validateCurrentPassword(userId: string, password: string): Promise<boolean> {
  try {
    // Implement password validation logic here
    console.log('Validating password for user:', userId);
    // In a real implementation, this would check the password against the stored hash
    
    return true;
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
}

export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
  try {
    if (!userId) return false;
    
    const currentTime = new Date().toISOString();
    
    // Use presence channels instead of direct database updates
    const channel = supabase.channel('online-users');
    
    if (isOnline) {
      // Track user's presence when online
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: currentTime,
          });
        }
      });
    } else {
      // Remove tracking when offline
      await channel.untrack();
      await supabase.removeChannel(channel);
    }
    
    // Also store the status in localStorage as a fallback
    localStorage.setItem(
      isOnline ? 'lastActiveTime' : 'lastOfflineTime',
      currentTime
    );
    
    return true;
  } catch (error) {
    console.error('Online status update error:', error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    // Implement get current user logic here
    // This is a placeholder implementation
    // In a real implementation, this would retrieve the current user from the session
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: ProfileUpdateData): Promise<boolean> {
  try {
    // Implement profile update logic here
    console.log('Updating profile for user:', userId, 'with data:', data);
    // In a real implementation, this would update the user's profile in the database
    
    return true;
  } catch (error) {
    console.error('Profile update error:', error);
    return false;
  }
}
