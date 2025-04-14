
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/auth/AuthProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PostProvider } from '@/context/PostContext';
import { AchievementProvider } from '@/context/AchievementContext';
import { MentionsProvider } from '@/components/common/MentionsProvider';
import { GameProvider } from '@/context/GameContext';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import FriendRequests from '@/pages/FriendRequests';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import Friends from '@/pages/Friends';
import AddFriends from '@/pages/AddFriends';
import Search from '@/pages/Search';
import Games from '@/pages/Games';
import Snake from '@/pages/games/Snake';
import Trivia from '@/pages/games/Trivia';
import TicTacToe from '@/pages/games/TicTacToe';
import Reports from '@/pages/Reports';
import Table from '@/pages/Table';
import Earn from '@/pages/Earn';
import Achievements from '@/pages/Achievements';
import Leaderboard from '@/pages/Leaderboard';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <LanguageProvider>
              <PostProvider>
                <GameProvider>
                  <AchievementProvider>
                    <MentionsProvider>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/profile/:username" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/friend-requests" element={<FriendRequests />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/add-friends" element={<AddFriends />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/games" element={<Games />} />
                        <Route path="/games/snake" element={<Snake />} />
                        <Route path="/games/trivia" element={<Trivia />} />
                        <Route path="/games/tictactoe" element={<TicTacToe />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/table" element={<Table />} />
                        <Route path="/earn" element={<Earn />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      <Toaster />
                    </MentionsProvider>
                  </AchievementProvider>
                </GameProvider>
              </PostProvider>
            </LanguageProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
