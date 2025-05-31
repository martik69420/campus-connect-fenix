
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { PostProvider } from './context/PostContext';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/auth';
import { TooltipProvider } from '@/components/ui/tooltip';

// Import your pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
// ... any other page imports

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <NotificationProvider>
                <PostProvider>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    {/* Add other routes as needed */}
                  </Routes>
                  <Toaster />
                </PostProvider>
              </NotificationProvider>
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
