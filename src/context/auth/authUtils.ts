import { supabase } from "@/integrations/supabase/client";

export async function loginUser(username: string, password: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      console.error("Supabase sign-in error:", error);
      return null;
    }

    if (!data.user) {
      console.warn("No user found after sign-in.");
      return null;
    }

    // Fetch the user's profile from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    if (!profileData) {
      console.warn("No profile data found for user.");
      return null;
    }

    // Combine user data from auth and profile
    const user = {
      id: data.user.id,
      username: profileData.username,
      email: data.user.email || profileData.email,
      displayName: profileData.display_name,
      school: profileData.school,
      avatar: profileData.avatar_url || null,
      coins: profileData.coins || 0,
    };

    return user;
  } catch (error: any) {
    console.error("Error in loginUser:", error);
    return null;
  }
}

export async function registerUser(
  username: string,
  email: string,
  displayName: string,
  school: string,
  password: string
): Promise<{ success: boolean; user: any | null }> {
  try {
    // First, create the user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error("Supabase auth sign-up error:", authError);
      return { success: false, user: null };
    }

    if (!authData.user) {
      console.warn("No user found after sign-up.");
      return { success: false, user: null };
    }

    // Then, create a profile for the user in the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          username: username,
          email: email,
          display_name: displayName,
          school: school,
        },
      ])
      .select('*')
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);

      // Optionally, delete the user from auth if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);

      return { success: false, user: null };
    }

    // Combine user data from auth and profile
    const user = {
      id: authData.user.id,
      username: profileData.username,
      email: authData.user.email || profileData.email,
      displayName: profileData.display_name,
      school: profileData.school,
      avatar: profileData.avatar_url || null,
      coins: profileData.coins || 0,
    };

    return { success: true, user: user };
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    return { success: false, user: null };
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      id: userId,
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in changePassword:", error);
    return false;
  }
}

export async function validateCurrentPassword(userId: string, password: string): Promise<boolean> {
  try {
    // This is a simplified validation and might not be secure enough for production.
    // In a real-world scenario, you should re-authenticate the user.

    // Fetch the user's data to get the email (required for signInWithPassword)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return false;
    }

    if (!profileData || !profileData.email) {
      console.error("Could not retrieve email for user.");
      return false;
    }

    // Attempt to sign in with the provided email and password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password: password,
    });

    if (signInError) {
      console.error("Invalid current password:", signInError);
      return false; // Password does not match
    }

    return true; // Password matches
  } catch (error) {
    console.error("Error in validateCurrentPassword:", error);
    return false;
  }
}

export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_status')
      .upsert(
        {
          user_id: userId,
          is_online: isOnline,
          last_active: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error("Error updating online status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateOnlineStatus:", error);
    return false;
  }
}

export async function getCurrentUser(): Promise<any | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }

    if (!session?.user) {
      console.warn("No active session found.");
      return null;
    }

    // Fetch the user's profile from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    if (!profileData) {
      console.warn("No profile data found for user.");
      return null;
    }

    // Combine user data from auth and profile
    const user = {
      id: session.user.id,
      username: profileData.username,
      email: session.user.email || profileData.email,
      displayName: profileData.display_name,
      school: profileData.school,
      avatar: profileData.avatar_url || null,
      coins: profileData.coins || 0,
    };

    return user;
  } catch (error: any) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: {
  displayName?: string;
  bio?: string;
  school?: string;
  avatar?: string;
}): Promise<boolean> {
  try {
    if (!userId) return false;
    
    const updateData: Record<string, any> = {};
    
    // Map frontend keys to database column names
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.school !== undefined) updateData.school = data.school;
    if (data.avatar !== undefined) updateData.avatar_url = data.avatar;
    
    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return true;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
}
