
import * as React from 'react';
import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/auth';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import { GameProvider } from './context/GameContext';
import { Toaster } from '@/components/ui/toaster';
import NotificationPermissionBanner from '@/components/notifications/NotificationPermissionBanner';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';

// Add window.adsbygoogle type declaration if not already defined
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Lazy load components to optimize initial load time
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
const Games = lazy(() => import('./pages/Games'));
const Snake = lazy(() => import('./pages/Snake'));
const Trivia = lazy(() => import('./pages/Trivia'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Friends = lazy(() => import('./pages/Friends'));
const AddFriends = lazy(() => import('./pages/AddFriends'));
const Earn = lazy(() => import('./pages/Earn'));
const Search = lazy(() => import('./pages/Search'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const location = useLocation();

  // Preload priority pages based on current location
  useEffect(() => {
    // Preload critical pages that might be navigated to next
    if (location.pathname === '/') {
      // If on home, preload messages and profile
      import('./pages/Messages');
      import('./pages/Friends');
    } else if (location.pathname.includes('/messages')) {
      // If in messages, preload friends and index
      import('./pages/Friends');
      import('./pages/Index');
    } else if (location.pathname.includes('/friends')) {
      // If in friends, preload messages and add-friends
      import('./pages/Messages');
      import('./pages/AddFriends');
    }
  }, [location.pathname]);

  // Initialize AdSense once at app level
  useEffect(() => {
    // Add AdSense script if it doesn't exist
    if (!document.getElementById('adsense-script')) {
      const script = document.createElement('script');
      script.id = 'adsense-script';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3116464894083582';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
    
    // Initialize window.adsbygoogle if not already initialized
    try {
      window.adsbygoogle = window.adsbygoogle || [];
    } catch (e) {
      console.error('AdSense initialization error:', e);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <PostProvider>
              <GameProvider>
                <div className="app dark:bg-background">
                  <NotificationPermissionBanner />
                  <AnimatePresence mode="wait" initial={false}>
                    <Routes location={location} key={location.pathname}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Index />
                        </Suspense>
                      } />
                      <Route path="/profile/:username" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Profile />
                        </Suspense>
                      } />
                      <Route path="/messages" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Messages />
                        </Suspense>
                      } />
                      <Route path="/games" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Games />
                        </Suspense>
                      } />
                      <Route path="/snake" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Snake />
                        </Suspense>
                      } />
                      <Route path="/trivia" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Trivia />
                        </Suspense>
                      } />
                      <Route path="/settings" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Settings />
                        </Suspense>
                      } />
                      <Route path="/notifications" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Notifications />
                        </Suspense>
                      } />
                      <Route path="/leaderboard" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Leaderboard />
                        </Suspense>
                      } />
                      <Route path="/friends" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Friends />
                        </Suspense>
                      } />
                      <Route path="/add-friends" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <AddFriends />
                        </Suspense>
                      } />
                      <Route path="/earn" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Earn />
                        </Suspense>
                      } />
                      <Route path="/search" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Search />
                        </Suspense>
                      } />
                      <Route path="*" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <NotFound />
                        </Suspense>
                      } />
                    </Routes>
                  </AnimatePresence>
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
