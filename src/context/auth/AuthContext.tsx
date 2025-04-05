
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  school: string;
  location?: string | null;
  coins?: number;
  createdAt?: string;
  lastActive?: string | null;
  isOnline?: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
  school?: string;
  location?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string, school: string) => Promise<boolean>;
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  addCoins: (amount: number, reason?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper functions for user authentication
  const getCurrentUser = async () => {
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
      } as User;
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return null;
    }
  };

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
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

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session first
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            updateOnlineStatus(currentUser.id, true);
          } else {
            // User is logged in but doesn't have a profile - sign them out
            console.log("User is logged in but doesn't have a profile - signing out");
            await supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              setIsAuthenticated(true);
              updateOnlineStatus(currentUser.id, true);
            } else {
              // User signed in but profile not found
              console.error("User signed in but profile not found");
              await supabase.auth.signOut();
              setUser(null);
              setIsAuthenticated(false);
              setAuthError("User profile not found. Please contact support.");
            }
          } catch (error) {
            console.error("Error getting user:", error);
            setAuthError("Error retrieving user profile");
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    // Run initialization
    initializeAuth();

    // Update online status when window focus changes
    const handleVisibilityChange = () => {
      if (user && document.visibilityState === "visible") {
        updateOnlineStatus(user.id, true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up beforeunload event to update status when user leaves
    window.addEventListener("beforeunload", () => {
      if (user) {
        // Use a synchronous method to update status before page unloads
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/update-status", false); // false makes it synchronous
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ userId: user.id, isOnline: false }));
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  // Authentication functions
  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (!identifier.trim() || !password.trim()) {
        setAuthError("Please enter both username/email and password");
        return false;
      }
      
      console.log("Performing credential validation");
      
      // Determine if input is email or username
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
          setAuthError("Error looking up user account");
          return false;
        }
        
        if (!userData || !userData.email) {
          console.error("User not found with username:", identifier);
          setAuthError("No account found with that username");
          return false;
        }
        
        userEmail = userData.email;
      }
      
      // Attempt to login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });
      
      if (error) {
        console.error("Login authentication failed:", error);
        setAuthError(error.message || "Invalid login credentials");
        return false;
      }
      
      if (!data.session) {
        console.error("No session returned after login");
        setAuthError("Authentication failed");
        return false;
      }
      
      // Get the complete user profile after successful authentication
      const userData = await getCurrentUser();
      if (!userData) {
        setAuthError("Successfully authenticated but failed to retrieve user profile");
        return false;
      }
      
      // Set user data
      setUser(userData);
      setIsAuthenticated(true);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.displayName || userData.username}!`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Login process failed:", error);
      setAuthError(error.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    school: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Basic validation
      if (!email.trim() || !password.trim() || !username.trim() || !displayName.trim() || !school.trim()) {
        setAuthError("All fields are required");
        return false;
      }
      
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long");
        return false;
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        setAuthError("Please enter a valid email address");
        return false;
      }
      
      // Check if username is already taken
      const { data: existingUser, error: existingUserError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
      if (existingUser) {
        setAuthError("This username is already taken. Please choose another one.");
        return false;
      }
      
      // Check if email is already taken in profiles table
      const { data: existingEmail, error: existingEmailError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();
        
      if (existingEmail) {
        setAuthError("This email is already registered. Please use a different email or log in.");
        return false;
      }
      
      // Sign up with Supabase Auth
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (signUpError || !authUser) {
        setAuthError(signUpError?.message || "Registration failed");
        return false;
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
        setAuthError("Account created but failed to set up profile");
        return false;
      }
      
      // Create new user object
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
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Show success toast
      toast({
        title: "Registration successful",
        description: "Welcome to Campus Fenix!",
      });
      
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "Registration failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (user) {
        await updateOnlineStatus(user.id, false);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      setUser(null);
      setIsAuthenticated(false);
      console.log("User successfully logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the user profile
  const updateUserProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      if (!user) return false;
      
      setIsLoading(true);
      const updateData: any = {};
      
      if (profileData.displayName !== undefined) updateData.display_name = profileData.displayName;
      if (profileData.avatar !== undefined) updateData.avatar_url = profileData.avatar;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.school !== undefined) updateData.school = profileData.school;
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating profile:", error);
        return false;
      }
      
      // Update local user state with new profile data
      setUser({
        ...user,
        ...profileData,
      });
      
      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateCurrentPassword = async (email: string, password: string): Promise<boolean> => {
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

  // Password change functionality
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      if (!user || !user.email) return false;
      
      setIsLoading(true);
      
      // First validate the current password
      const isCurrentPasswordValid = await validateCurrentPassword(user.email, currentPassword);
      
      if (!isCurrentPasswordValid) {
        setAuthError("Current password is incorrect");
        return false;
      }
      
      // Then change to the new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setAuthError(error.message || "Failed to change password");
        return false;
      }
      
      // Show success toast
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed",
      });
      
      return true;
    } catch (error: any) {
      console.error("Password change error:", error);
      setAuthError(error.message || "Failed to change password");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      if (!user) {
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update user profile with new avatar URL
      const success = await updateUserProfile({
        avatar: avatarUrl
      });

      if (success) {
        return avatarUrl;
      }
      
      return null;
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      return null;
    }
  };
  
  // Update user data
  const updateUser = (userData: Partial<User>): void => {
    if (!user) return;
    setUser({
      ...user,
      ...userData
    });
  };
  
  // Add coins to user balance
  const addCoins = async (amount: number, reason?: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Update coins in database
      const { error } = await supabase
        .from('profiles')
        .update({ coins: (user.coins || 0) + amount })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUser({
        ...user,
        coins: (user.coins || 0) + amount
      });
      
      // Log the transaction
      console.log(`Coin transaction for user ${user.id}: ${amount} coins (${reason || 'No reason provided'})`);
      
      return true;
    } catch (error) {
      console.error("Error adding coins:", error);
      return false;
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUserProfile,
    changePassword,
    uploadProfilePicture,
    updateUser,
    addCoins,
    authError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for accessing auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
