
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, mapProfileToUser } from "./types";

// Login function with password
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Find user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error("Login error:", error);
      throw error;
    }
    
    if (!profile) {
      toast({
        title: "Login failed",
        description: "User not found",
        variant: "destructive",
      });
      return null;
    }

    // Verify password
    const { data: isValid } = await supabase
      .rpc('validate_password', {
        username,
        password
      });

    if (!isValid) {
      toast({
        title: "Login failed",
        description: "Invalid password",
        variant: "destructive",
      });
      return null;
    }

    // Map profile to our User model
    const mappedUser = mapProfileToUser(profile);
    
    console.log("User logged in successfully:", mappedUser);
    
    toast({
      title: "Welcome back!",
      description: `Logged in as ${profile.display_name}`,
    });
    
    return mappedUser;
  } catch (error: any) {
    console.error("Login error details:", error);
    toast({
      title: "Login failed",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return null;
  }
};

// Register function - updated to include email and proper Supabase registration
export const registerUser = async (
  username: string, 
  email: string,
  displayName: string, 
  school: string, 
  password: string
): Promise<User | null> => {
  try {
    console.log("Attempting to register user:", { username, email, displayName, school });
    
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // If error is not "no rows returned", it's a real error
      console.error("Check username error:", checkError);
      throw checkError;
    }

    if (existingUser) {
      toast({
        title: "Registration failed",
        description: "Username already taken",
        variant: "destructive",
      });
      return null;
    }

    // Create new user directly in profiles table
    const userId = crypto.randomUUID(); // Generate a UUID for the new user
    
    const newUserData = {
      id: userId,
      username,
      email,
      display_name: displayName,
      avatar_url: "/placeholder.svg",
      coins: 100,
      invite_code: "", // Required field in the profiles table
      school,
      password_hash: password, // In a real app, hash this!
      bio: ""
    };

    console.log("Creating new user profile:", newUserData);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(newUserData);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw profileError;
    }
    
    // Create our User model
    const newUser: User = {
      id: newUserData.id,
      username: newUserData.username,
      email: newUserData.email,
      displayName: newUserData.display_name,
      avatar: newUserData.avatar_url,
      coins: newUserData.coins,
      inviteCode: newUserData.invite_code,
      createdAt: new Date(),
      school: newUserData.school,
      bio: newUserData.bio,
      friends: []
    };
    
    console.log("User registered successfully:", newUser);
    
    toast({
      title: "Welcome to Campus Fenix!",
      description: "Your account has been created successfully.",
    });
    
    return newUser;
  } catch (error: any) {
    console.error("Registration error details:", error);
    toast({
      title: "Registration failed",
      description: error.message || "An unexpected error occurred",
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

    toast({
      title: "Success",
      description: "Password updated successfully",
    });
    return true;
  } catch (error: any) {
    toast({
      title: "Failed to update password",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
};

// Validate current password
export const validateCurrentPassword = async (username: string, password: string): Promise<boolean> => {
  try {
    const { data: isValid } = await supabase
      .rpc('validate_password', {
        username,
        password
      });
    
    return !!isValid;
  } catch (error) {
    console.error("Error validating password:", error);
    return false;
  }
};
