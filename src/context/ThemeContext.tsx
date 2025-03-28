
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from '@/integrations/supabase/client';

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
  const { user, isAuthenticated } = useAuth();

  // Load theme from localStorage first
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  // Fetch user theme preference when authenticated
  useEffect(() => {
    const fetchThemePreference = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('theme')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching theme preference:', error);
            return;
          }
          
          if (data && data.theme) {
            const userTheme = data.theme as Theme;
            setThemeState(userTheme);
            localStorage.setItem('theme', userTheme);
            document.documentElement.classList.toggle('dark', userTheme === 'dark');
          }
        } catch (error) {
          console.error('Failed to fetch theme settings:', error);
        }
      }
    };
    
    fetchThemePreference();
  }, [isAuthenticated, user?.id]);

  // Function to set theme and save preference to database
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    if (isAuthenticated && user?.id) {
      try {
        // Check if user settings exist
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (existingSettings) {
          // Update existing settings
          const { error } = await supabase
            .from('user_settings')
            .update({ theme: newTheme })
            .eq('user_id', user.id);
            
          if (error) {
            console.error('Error updating theme preference:', error);
          }
        } else {
          // Create new settings
          const { error } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id, theme: newTheme });
            
          if (error) {
            console.error('Error creating theme preference:', error);
          }
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
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
