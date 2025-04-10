
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Home, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Gamepad2, 
  Search,
  Users,
  Trophy,
  Heart
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth';
import { useNotification } from '@/context/NotificationContext';

const MobileNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', path: '/messages' },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', path: '/notifications' },
    { icon: <Users className="h-5 w-5" />, label: 'Friends', path: '/friends' },
    { icon: <Search className="h-5 w-5" />, label: 'Search', path: '/search' },
    { icon: <Gamepad2 className="h-5 w-5" />, label: 'Games', path: '/games' },
    { icon: <Heart className="h-5 w-5" />, label: 'Earn', path: '/earn' },
    { icon: <Trophy className="h-5 w-5" />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <User className="h-5 w-5" />, label: 'Profile', path: `/profile/${user?.username}` },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' },
  ];
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/auth');
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 sm:hidden">
      <div className="flex justify-between items-center px-4 py-2">
        {/* Bottom Tab Navigation */}
        <Link to="/" className="flex flex-col items-center justify-center p-2">
          <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/messages" className="flex flex-col items-center justify-center p-2">
          <MessageSquare className={`h-5 w-5 ${location.pathname === '/messages' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-xs mt-1">Messages</span>
        </Link>
        
        <Link to="/notifications" className="flex flex-col items-center justify-center p-2 relative">
          <Bell className={`h-5 w-5 ${location.pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'}`} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="text-xs mt-1">Alerts</span>
        </Link>
        
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full p-2 flex flex-col items-center justify-center">
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
            <div className="pt-4 pb-16 px-2">
              <div className="flex items-center mb-6 px-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.displayName} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user?.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {navItems.map((item) => (
                  <Button 
                    key={item.path}
                    variant="ghost"
                    className="flex flex-col items-center justify-center h-auto py-4 px-1"
                    onClick={() => {
                      closeMenu();
                      navigate(item.path);
                    }}
                  >
                    <div className={`mb-1 ${location.pathname === item.path ? 'text-primary' : 'text-foreground'}`}>
                      {item.icon}
                    </div>
                    <span className="text-xs text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
              
              <Button 
                variant="destructive"
                className="w-full mt-8"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileNavBar;
