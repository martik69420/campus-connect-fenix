
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
  Gamepad2
} from "lucide-react";

// Define the navigation items for the sidebar
const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: MessagesSquare, label: 'Messages', href: '/messages' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Users, label: 'Friends', href: '/friends' },
  { icon: UserPlus, label: 'Add Friends', href: '/add-friends' },
  { icon: Gamepad2, label: 'Games', href: '/games' },
  { icon: Heart, label: 'Earn', href: '/earn' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const Sidebar = () => {
  const { user, logout, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <Link to="/" className="font-bold text-lg flex items-center">
          <img src="/logo.svg" alt="Logo" className="mr-2 h-6 w-6" />
          Fenix
        </Link>
      </div>

      <Separator />

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
              <Button variant="ghost" className="flex h-auto w-full items-center justify-between gap-2 p-0 font-normal">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || "Avatar"} />
                    <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user.username}`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                {t('auth.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Separator />

      <div className="flex-1 p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 rounded-md p-2 hover:bg-secondary",
                  location.pathname === item.href ? "bg-secondary text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
