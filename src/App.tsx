
import { Suspense, lazy, useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle navigation issues by tracking page loads
  useEffect(() => {
    let navigationTimeout: NodeJS.Timeout;
    let isMounted = true;
    
    // Mark start of navigation
    setIsLoading(true);
    
    // Set up navigation timeout detection with a shorter timeout
    navigationTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Navigation timeout detected, attempting recovery for path:', location.pathname);
        
        // Clear loading state first
        setIsLoading(false);
        
        // Force refresh the current location to recover from any broken state
        // Use a more direct approach to reset the route
        window.history.replaceState({}, '', location.pathname);
        navigate(location.pathname, { replace: true });
      }
    }, 3000); // Reduced from 5000ms to 3000ms
    
    // Clear loading state when component updates/unmounts
    const clearLoadingState = () => {
      if (isMounted) {
        setIsLoading(false);
        clearTimeout(navigationTimeout);
      }
    };
    
    // Use a shorter timeout to mark a successful navigation
    const successTimeout = setTimeout(clearLoadingState, 1000);
    
    // Clean up all timeouts when component unmounts or location changes
    return () => {
      isMounted = false;
      clearTimeout(navigationTimeout);
      clearTimeout(successTimeout);
    };
  }, [location.pathname, navigate]);
  
  return <>{children}</>;
};

function App() {
  // Add a fallback loading component that we can reuse
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

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
                      <Suspense fallback={<LoadingFallback />}>
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
