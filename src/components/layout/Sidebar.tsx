
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import OnlineStatus from "@/components/OnlineStatus";

// Import icons
import { 
  Home,
  MessagesSquare,
  Users,
  Settings,
  Bell,
  Search, 
  Heart,
  Trophy,
  UserPlus,
  Gamepad2,
  LogOut,
  Sparkles,
  User
} from "lucide-react";
import { motion } from "framer-motion";

// Define the navigation items for the sidebar with enhanced tooltips
const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/', tooltip: 'Go to homepage' },
  { icon: Search, label: 'Search', href: '/search', tooltip: 'Find people and content' },
  { icon: MessagesSquare, label: 'Messages', href: '/messages', tooltip: 'Chat with friends' },
  { icon: Bell, label: 'Notifications', href: '/notifications', tooltip: 'See your alerts' },
  { icon: Users, label: 'Friends', href: '/friends', tooltip: 'Manage your connections' },
  { icon: UserPlus, label: 'Add Friends', href: '/add-friends', tooltip: 'Grow your network' },
  { icon: Gamepad2, label: 'Games', href: '/games', tooltip: 'Play and win coins' },
  { icon: Heart, label: 'Earn', href: '/earn', tooltip: 'Earn more coins' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', tooltip: 'See top performers' },
  { icon: Settings, label: 'Settings', href: '/settings', tooltip: 'Customize your experience' },
];

const Sidebar = () => {
  const { user, logout, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const handleSignOut = async () => {
    await logout();
  };

  const handleNavClick = (href: string) => {
    setActiveItem(href);
    navigate(href);
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-30 bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="p-5">
        <Link to="/" onClick={() => setActiveItem('/')} className="font-bold text-xl flex items-center">
          <img src="/logo.svg" alt="Logo" className="mr-2 h-6 w-6" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Campus Connect
          </span>
        </Link>
      </div>

      <Separator className="opacity-50" />

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-auto w-full items-center justify-between gap-2 p-2 font-normal hover:bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-1 ring-primary/30">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || "Avatar"} />
                      <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <OnlineStatus userId={user.id} />
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user.username}`} onClick={() => setActiveItem(`/profile/${user.username}`)}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.li 
                key={item.label} 
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base py-6",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handleNavClick(item.href)}
                >
                  <div className="flex items-center w-full">
                    <item.icon className={cn(
                      "h-5 w-5 mr-3", 
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                    <span>{item.label}</span>
                    {item.label === 'Games' && (
                      <Sparkles className="h-3.5 w-3.5 ml-2 text-amber-400" />
                    )}
                    {item.label === 'Messages' && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">2</span>
                    )}
                  </div>
                </Button>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 mt-auto">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          <p>© 2025 Campus Connect</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
