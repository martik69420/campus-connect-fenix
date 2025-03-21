
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, Bell, User, Menu, X, Home, MessageSquare, Users, Gamepad2, Award, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const mobileNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/friends", icon: Users, label: "Friends" },
    { path: "/games", icon: Gamepad2, label: "Games" },
    { path: "/leaderboard", icon: Award, label: "Leaderboard" },
    { path: "/earn", icon: BarChart3, label: "Earn Coins" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 md:px-6">
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left">Campus Fenix</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col space-y-1 mt-4">
                {mobileNavItems.map((item) => (
                  <SheetClose asChild key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center gap-2 px-4 py-3 rounded-md transition-colors",
                        isActive 
                          ? "bg-fenix/10 text-fenix font-medium" 
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SheetClose>
                ))}
                
                <div className="pt-4 mt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Logo - only show on mobile */}
        <div className="md:hidden flex items-center">
          <span className="text-lg font-bold">Campus Fenix</span>
        </div>
        
        {/* Search bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Campus Fenix"
                className="pl-10 w-full"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NavLink to="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-fenix text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </NavLink>

          {/* Coins display */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
            <div className="w-5 h-5 rounded-full bg-fenix flex items-center justify-center">
              <span className="text-xs text-white font-bold">C</span>
            </div>
            <span className="text-sm font-medium">{user?.coins || 0}</span>
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.displayName} />
                  <AvatarFallback className="bg-fenix text-white">
                    {user?.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.displayName} />
                  <AvatarFallback className="bg-fenix text-white">
                    {user?.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{user?.username}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
