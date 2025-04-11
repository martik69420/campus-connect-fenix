
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load theme from localStorage first
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  // Setup Supabase auth listener to get user ID directly
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Fetch user theme preference when authenticated
  useEffect(() => {
    const fetchThemePreference = async () => {
      if (userId) {
        try {
          // Get user settings from database
          const { data, error } = await supabase
            .from('user_settings')
            .select('theme')
            .eq('user_id', userId)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is code for "no rows returned", so we'll create a new settings row below
            console.error('Error fetching theme settings:', error);
            return;
          }
          
          if (data?.theme) {
            // If theme exists in database, use it
            setThemeState(data.theme as Theme);
            localStorage.setItem('theme', data.theme);
            document.documentElement.classList.toggle('dark', data.theme === 'dark');
          } else {
            // If no theme setting in database, use the one from localStorage or default
            const userTheme = localStorage.getItem('theme') as Theme || 'light';
            
            // Store current theme preference in the database
            await supabase
              .from('user_settings')
              .upsert({ 
                user_id: userId,
                theme: userTheme
              });
              
            setThemeState(userTheme);
            localStorage.setItem('theme', userTheme);
            document.documentElement.classList.toggle('dark', userTheme === 'dark');
          }
        } catch (error) {
          console.error('Failed to fetch or store theme settings:', error);
        }
      }
    };
    
    fetchThemePreference();
  }, [userId]);

  // Function to set theme and save preference to database
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Save theme to database if user is authenticated
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({ 
            user_id: userId,
            theme: newTheme
          });
          
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        toast({
          title: "Error saving preference",
          description: "Your theme preference couldn't be saved to your account",
          variant: "destructive"
        });
      }
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
