
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Games from './pages/Games';
import Search from './pages/Search';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/auth/AuthProvider';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { GameProvider } from './context/GameContext';
import { ThemeProvider } from './context/ThemeContext';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import AddFriends from './pages/AddFriends';
import Earn from './pages/Earn';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <PostProvider>
            <NotificationProvider>
              <GameProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="/add-friends" element={<AddFriends />} />
                  <Route path="/earn" element={<Earn />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </GameProvider>
            </NotificationProvider>
          </PostProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
