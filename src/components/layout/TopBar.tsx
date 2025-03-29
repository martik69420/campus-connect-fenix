
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, Bell, User, Menu, Home, MessageSquare, Users, Gamepad2, Award, BarChart3, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import NotificationMenu from "@/components/notifications/NotificationMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TopBar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { unreadCount } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Fetch user's coin balance from the database
  useEffect(() => {
    const fetchUserCoins = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user coins:', error);
            return;
          }
          
          if (data && data.coins !== undefined && data.coins !== user.coins) {
            // Only update if there's a difference to avoid infinite loops
            updateUser({ coins: data.coins });
          }
        } catch (error) {
          console.error('Failed to fetch user coins:', error);
        }
      }
    };
    
    fetchUserCoins();
    
    // Set up a polling interval to keep coins in sync
    const interval = setInterval(fetchUserCoins, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user?.id, user?.coins, updateUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const mobileNavItems = [
    { path: "/", icon: Home, label: t('nav.home') },
    { path: `/profile/${user?.username}`, icon: User, label: t('nav.profile') },
    { path: "/notifications", icon: Bell, label: t('settings.notifications') },
    { path: "/messages", icon: MessageSquare, label: t('nav.messages') },
    { path: "/friends", icon: Users, label: t('settings.friends') },
    { path: "/games", icon: Gamepad2, label: t('games.title') },
    { path: "/leaderboard", icon: Award, label: t('leaderboard.title') },
    { path: "/earn", icon: BarChart3, label: t('coins.earn') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md dark:border-gray-800">
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
                          ? "bg-primary/10 text-primary font-medium" 
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
                    {t('auth.logout')}
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
                placeholder={t('nav.search')}
                className="pl-10 w-full"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleTheme}
                  className="text-muted-foreground"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications Dropdown */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <NotificationMenu />
                  </DropdownMenu>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Coins display */}
          <NavLink to="/earn" className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs text-white font-bold">C</span>
            </div>
            <span className="text-sm font-medium">{user?.coins || 0}</span>
          </NavLink>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{user?.username}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/profile/${user?.username}`)}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Bell className="mr-2 h-4 w-4" />
                <span>{t('nav.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
