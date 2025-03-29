import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuItem
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import NotificationMenu from '@/components/notifications/NotificationMenu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', path: '/messages' },
    { icon: <Gamepad2 className="h-5 w-5" />, label: 'Games', path: '/games' },
    { icon: <Search className="h-5 w-5" />, label: 'Search', path: '/search' },
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
  
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.url) {
      navigate(notification.url);
    } else if (notification.relatedId) {
      if (notification.type === 'like' || notification.type === 'comment') {
        navigate(`/posts/${notification.relatedId}`);
      } else if (notification.type === 'friend') {
        navigate(`/profile/${notification.relatedId}`);
      }
    } else if (notification.type === 'message') {
      navigate('/messages');
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <div className="rounded-full bg-red-500/10 p-1"><Bell className="h-3 w-3 text-red-500" /></div>;
      case 'comment':
        return <div className="rounded-full bg-blue-500/10 p-1"><MessageSquare className="h-3 w-3 text-blue-500" /></div>;
      case 'friend':
        return <div className="rounded-full bg-green-500/10 p-1"><User className="h-3 w-3 text-green-500" /></div>;
      case 'message':
        return <div className="rounded-full bg-purple-500/10 p-1"><MessageSquare className="h-3 w-3 text-purple-500" /></div>;
      default:
        return <div className="rounded-full bg-primary/10 p-1"><Bell className="h-3 w-3 text-primary" /></div>;
    }
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
              <DropdownMenu>
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
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex justify-between items-center p-4 border-b">
                    <span className="font-semibold text-lg">Notifications</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  
                  <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                      <div className="py-1">
                        {notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification.id}
                            className={`flex items-start p-3 cursor-pointer hover:bg-muted/50 ${!notification.read ? 'bg-muted/30' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="mr-3">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary ml-2 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No notifications yet</p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="py-2 justify-center font-medium text-primary text-center"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
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
