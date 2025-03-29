
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
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
          // We use a local variable instead of directly accessing theme property
          // since it doesn't exist in the database yet
          let userTheme = localStorage.getItem('theme') as Theme || 'light';
          setThemeState(userTheme);
          localStorage.setItem('theme', userTheme);
          document.documentElement.classList.toggle('dark', userTheme === 'dark');
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
    
    // Since the theme column doesn't exist yet in user_settings,
    // we'll just use localStorage for now
    // In a production app, you would alter the database to add this column
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
