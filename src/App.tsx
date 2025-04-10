
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/auth';
import { PostProvider } from './context/PostContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { GameProvider } from './context/GameContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/index'));
const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AddFriends = lazy(() => import('./pages/AddFriends'));
const Search = lazy(() => import('./pages/Search'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Earn = lazy(() => import('./pages/Earn'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Games = lazy(() => import('./pages/Games'));
const Snake = lazy(() => import('./pages/Snake'));
const Trivia = lazy(() => import('./pages/Trivia'));
const Table = lazy(() => import('./pages/Table'));

// This component handles navigation operations and preventing infinite loading
const NavigationHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle navigation issues by tracking page loads
  useEffect(() => {
    // Set up navigation timeout detection
    const navigationTimeout = setTimeout(() => {
      console.log('Navigation timeout detected, trying to recover...');
      
      // Force refresh the current location to recover from any broken state
      const currentPath = location.pathname;
      navigate('/', { replace: true });
      
      // Go back to the original path after a brief moment
      setTimeout(() => {
        navigate(currentPath, { replace: true });
      }, 100);
    }, 5000);
    
    // Clear the timeout when location changes correctly
    return () => clearTimeout(navigationTimeout);
  }, [location.pathname, navigate]);
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <PostProvider>
                <GameProvider>
                  <TooltipProvider>
                    <NavigationHandler>
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-screen">
                          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      }>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/" element={<Home />} />
                          <Route path="/profile/:username" element={<Profile />} />
                          <Route path="/friends" element={<Friends />} />
                          <Route path="/messages" element={<Messages />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/add-friends" element={<AddFriends />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/earn" element={<Earn />} />
                          <Route path="/leaderboard" element={<Leaderboard />} />
                          <Route path="/games" element={<Games />} />
                          <Route path="/games/snake" element={<Snake />} />
                          <Route path="/games/trivia" element={<Trivia />} />
                          <Route path="/table" element={<Table />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </NavigationHandler>
                    <Toaster />
                  </TooltipProvider>
                </GameProvider>
              </PostProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
