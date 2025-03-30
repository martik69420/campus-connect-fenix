
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import { GameProvider } from './context/GameContext';
import { Toaster } from '@/components/ui/toaster';
import NotificationPermissionBanner from '@/components/notifications/NotificationPermissionBanner';

import Auth from './pages/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Games from './pages/Games';
import Snake from './pages/Snake';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Friends from './pages/Friends';
import AddFriends from './pages/AddFriends';
import Earn from './pages/Earn';
import Search from './pages/Search';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <PostProvider>
              <GameProvider>
                <div className="app dark:bg-background">
                  <NotificationPermissionBanner />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/snake" element={<Snake />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/add-friends" element={<AddFriends />} />
                    <Route path="/earn" element={<Earn />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                </div>
              </GameProvider>
            </PostProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
