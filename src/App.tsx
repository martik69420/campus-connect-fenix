
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/auth";
import { ThemeProvider } from "./context/ThemeContext";
import { PostProvider } from "./context/PostContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AchievementProvider } from './context/AchievementContext';
import { AuthProvider } from './context/auth'; // Make sure AuthProvider is imported
import { LanguageProvider } from './context/LanguageContext'; // Import LanguageProvider
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
import NotFound from "./pages/NotFound";

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
      {/* AuthProvider needs to be above any component that uses useAuth */}
      <AuthProvider>
        <LanguageProvider> {/* Add LanguageProvider here */}
          <NotificationProvider>
            <PostProvider>
              <AchievementProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                  <Route path="/friend-requests" element={<ProtectedRoute><FriendRequests /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                  <Route path="/games/snake" element={<ProtectedRoute><Snake /></ProtectedRoute>} />
                  <Route path="/games/trivia" element={<ProtectedRoute><Trivia /></ProtectedRoute>} />
                  <Route path="/games/tic-tac-toe" element={<ProtectedRoute><TicTacToe /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                  <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </AchievementProvider>
            </PostProvider>
          </NotificationProvider>
        </LanguageProvider> {/* Close LanguageProvider */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
