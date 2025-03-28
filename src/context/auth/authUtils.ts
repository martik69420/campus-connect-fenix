
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, mapProfileToUser } from "./types";

// Login function
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Call the validate_password function to check credentials
    const { data: isValid, error: validateError } = await supabase
      .rpc('validate_password', {
        username: username,
        password: password
      });

    if (validateError) {
      console.error("Login validation error:", validateError);
      toast({
        title: "Login failed",
        description: validateError.message,
        variant: "destructive",
      });
      return null;
    }

    if (!isValid) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      toast({
        title: "Login failed",
        description: "Could not retrieve user profile",
        variant: "destructive",
      });
      return null;
    }

    // Update online status
    await supabase
      .from('user_status')
      .upsert({
        user_id: profile.id,
        is_online: true,
        last_active: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Map profile to user model
    const user = mapProfileToUser(profile);
    
    toast({
      title: "Login successful",
      description: "Welcome back, " + user.displayName,
    });

    return user;
  } catch (error: any) {
    console.error("Login error:", error);
    toast({
      title: "Login error",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
};

// Register function
export const registerUser = async (
  username: string, 
  email: string, 
  displayName: string, 
  school: string, 
  password: string
): Promise<User | null> => {
  try {
    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      toast({
        title: "Registration failed",
        description: checkError.message,
        variant: "destructive",
      });
      return null;
    }

    if (existingUser) {
      toast({
        title: "Username taken",
        description: "This username is already taken. Please choose another one.",
        variant: "destructive",
      });
      return null;
    }

    // Generate a UUID for the new user
    const { data: newId } = await supabase.rpc('gen_random_uuid');
    const userId = newId || crypto.randomUUID();

    // Create user profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        email,
        display_name: displayName,
        school,
        password_hash: password, // In production, this should be properly hashed
        coins: 100, // Starting coins
        avatar_url: '/placeholder.svg',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      toast({
        title: "Registration failed",
        description: createError.message,
        variant: "destructive",
      });
      return null;
    }

    // Create initial user settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: newProfile.id
      });

    // Set online status
    await supabase
      .from('user_status')
      .insert({
        user_id: newProfile.id,
        is_online: true,
        last_active: new Date().toISOString()
      });

    // Map profile to user model
    const user = mapProfileToUser(newProfile);
    
    toast({
      title: "Registration successful",
      description: "Welcome to Campus Connect, " + user.displayName,
    });

    return user;
  } catch (error: any) {
    console.error("Registration error:", error);
    toast({
      title: "Registration error",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
};

// Update password function
export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: newPassword })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Password change error:", error);
    return false;
  }
};

// Validate current password
export const validateCurrentPassword = async (userId: string, currentPassword: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (!user) return false;
    
    const { data } = await supabase
      .rpc('validate_password', {
        username: user.username,
        password: currentPassword
      });
      
    return !!data;
  } catch (error) {
    console.error("Password validation error:", error);
    return false;
  }
};

// Update user's online status
export const updateOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  if (!userId) return;
  
  try {
    await supabase
      .from('user_status')
      .upsert({
        user_id: userId,
        is_online: isOnline,
        last_active: new Date().toISOString()
      }, { onConflict: 'user_id' });
  } catch (error) {
    console.error("Error updating online status:", error);
  }
};
