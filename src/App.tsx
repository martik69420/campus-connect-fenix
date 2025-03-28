
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Games from './pages/Games';
import Search from './pages/Search';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/games" element={<Games />} />
            <Route path="/search" element={<Search />} />
          </Routes>
          <Toaster />
        </NotificationProvider>
      </PostProvider>
    </AuthProvider>
  );
}

export default App;
