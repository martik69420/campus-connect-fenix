
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { GameProvider } from "@/context/GameContext";
import { PostProvider } from "@/context/PostContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import AddFriends from "./pages/AddFriends";
import Games from "./pages/Games";
import Notifications from "./pages/Notifications";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PostProvider>
        <NotificationProvider>
          <GameProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="/add-friends" element={<AddFriends />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </GameProvider>
        </NotificationProvider>
      </PostProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
