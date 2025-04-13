
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/auth";
import { ThemeProvider } from "./context/ThemeContext";
import { PostProvider } from "./context/PostContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AchievementProvider } from './context/AchievementContext';
import { AuthProvider } from './context/auth';
import { LanguageProvider } from './context/LanguageContext';
import { GameProvider } from './context/GameContext';
import { Toaster } from "./components/ui/toaster";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Friends from "./pages/Friends";
import FriendRequests from "./pages/FriendRequests";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Games from "./pages/Games";
import Snake from "./pages/games/Snake";
import Trivia from "./pages/games/Trivia";
import TicTacToe from "./pages/games/TicTacToe";
import Reports from "./pages/Reports";
import Achievements from "./pages/Achievements";
import Earn from "./pages/Earn";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Table from "./pages/Table";
import AddFriends from "./pages/AddFriends";
import AppLayout from "./components/layout/AppLayout";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <PostProvider>
              <AchievementProvider>
                <GameProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
                    <Route path="/profile/:username" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><AppLayout><Friends /></AppLayout></ProtectedRoute>} />
                    <Route path="/add-friends" element={<ProtectedRoute><AppLayout><AddFriends /></AppLayout></ProtectedRoute>} />
                    <Route path="/friend-requests" element={<ProtectedRoute><AppLayout><FriendRequests /></AppLayout></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><AppLayout><Search /></AppLayout></ProtectedRoute>} />
                    <Route path="/table" element={<ProtectedRoute><AppLayout><Table /></AppLayout></ProtectedRoute>} />
                    <Route path="/games" element={<ProtectedRoute><AppLayout><Games /></AppLayout></ProtectedRoute>} />
                    <Route path="/games/snake" element={<ProtectedRoute><AppLayout><Snake /></AppLayout></ProtectedRoute>} />
                    <Route path="/games/trivia" element={<ProtectedRoute><AppLayout><Trivia /></AppLayout></ProtectedRoute>} />
                    <Route path="/games/tic-tac-toe" element={<ProtectedRoute><AppLayout><TicTacToe /></AppLayout></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><AppLayout><Achievements /></AppLayout></ProtectedRoute>} />
                    <Route path="/earn" element={<ProtectedRoute><AppLayout><Earn /></AppLayout></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                </GameProvider>
              </AchievementProvider>
            </PostProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
