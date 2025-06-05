
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { PostProvider } from './context/PostContext';
import { AchievementProvider } from './context/AchievementContext';
import { GameProvider } from './context/GameContext';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/auth';
import { TooltipProvider } from '@/components/ui/tooltip';

// Import your pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import Messages from './pages/Messages';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import AddFriends from './pages/AddFriends';
import Games from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Snake from './pages/games/Snake';
import Trivia from './pages/games/Trivia';
import FriendRequests from './pages/FriendRequests';
import Achievements from './pages/Achievements';

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
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <GameProvider>
                <AchievementProvider>
                  <NotificationProvider>
                    <PostProvider>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/friend-requests" element={<FriendRequests />} />
                        <Route path="/add-friends" element={<AddFriends />} />
                        <Route path="/games" element={<Games />} />
                        <Route path="/games/snake" element={<Snake />} />
                        <Route path="/games/trivia" element={<Trivia />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/profile/:username" element={<Profile />} />
                      </Routes>
                      <Toaster />
                    </PostProvider>
                  </NotificationProvider>
                </AchievementProvider>
              </GameProvider>
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
