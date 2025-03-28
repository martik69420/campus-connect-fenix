
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Home, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Gamepad2, 
  Search,
  CheckCircle,
  Award,
  BarChart3
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import NotificationMenu from '../notifications/NotificationMenu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', path: '/messages' },
    { icon: <Gamepad2 className="h-5 w-5" />, label: 'Games', path: '/games' },
    { icon: <Search className="h-5 w-5" />, label: 'Search', path: '/search' },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', path: '/notifications' },
    { icon: <User className="h-5 w-5" />, label: 'Friends', path: '/friends' },
    { icon: <Award className="h-5 w-5" />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Earn', path: '/earn' }
  ];
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Campus Connect</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-1">
          {user && navItems.map((item, index) => (
            <Button
              key={index}
              variant={location.pathname === item.path ? "default" : "ghost"}
              size="sm"
              className={cn(
                "justify-start",
                location.pathname === item.path && "bg-primary text-primary-foreground"
              )}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </nav>
        
        {/* User Menu & Actions */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <DropdownMenu open={notificationMenuOpen} onOpenChange={setNotificationMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <NotificationMenu />
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate('/auth')}>Log in</Button>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="px-1">
                <Link to="/" className="flex items-center gap-2 mb-8" onClick={closeMobileMenu}>
                  <span className="font-bold text-xl">Campus Connect</span>
                </Link>
                
                <nav className="grid gap-2">
                  {user && navItems.map((item, index) => (
                    <Button
                      key={index}
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      className={cn(
                        "justify-start w-full",
                        location.pathname === item.path && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        closeMobileMenu();
                      }}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  ))}
                  
                  {user && (
                    <>
                      <Button
                        variant={location.pathname.includes('/profile') ? "default" : "ghost"}
                        className="justify-start w-full"
                        onClick={() => {
                          navigate(`/profile/${user.username}`);
                          closeMobileMenu();
                        }}
                      >
                        <User className="h-5 w-5 mr-2" />
                        Profile
                      </Button>
                      
                      <Button
                        variant={location.pathname === '/settings' ? "default" : "ghost"}
                        className="justify-start w-full"
                        onClick={() => {
                          navigate('/settings');
                          closeMobileMenu();
                        }}
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        Settings
                      </Button>
                      
                      <DropdownMenuSeparator className="my-2" />
                      
                      <Button
                        variant="ghost"
                        className="justify-start w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        Log out
                      </Button>
                    </>
                  )}
                  
                  {!user && (
                    <Button
                      onClick={() => {
                        navigate('/auth');
                        closeMobileMenu();
                      }}
                      className="w-full"
                    >
                      Log in
                    </Button>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
