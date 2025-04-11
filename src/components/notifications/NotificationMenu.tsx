
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare, Heart, Check, UserPlus, User, Megaphone, Trash2, AtSign, X } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface NotificationMenuProps {
  onClose?: () => void;
}

const NotificationMenu = ({ onClose }: NotificationMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications,
    deleteNotification,
    fetchNotifications, 
    requestNotificationPermission,
    isNotificationPermissionGranted
  } = useNotification();
  const { t } = useLanguage();
  
  // Refresh notifications when menu opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type and url
    if (notification.url) {
      navigate(notification.url);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'like') {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'comment') {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'friend') {
      navigate(`/profile/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.type === 'message') {
      navigate('/messages');
      if (onClose) onClose();
    } else if (notification.type === 'mention' && notification.relatedId) {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    }
  };
  
  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You will now receive push notifications",
      });
    } else {
      toast({
        title: "Notification permission denied",
        description: "Enable notifications in your browser settings to receive alerts",
        variant: "destructive"
      });
    }
  };

  const handleClearAllNotifications = () => {
    setIsAlertOpen(true);
  };

  const confirmClearAllNotifications = async () => {
    await clearAllNotifications();
    setIsAlertOpen(false);
    toast({
      title: "Success",
      description: "All notifications cleared",
    });
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent notification click event
    await deleteNotification(id);
    toast({
      title: "Success",
      description: "Notification deleted",
    });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'friend':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Megaphone className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Group notifications by time (Today, Yesterday, Older)
  const groupNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      older: [] as any[]
    };
    
    notifications.forEach(notification => {
      const notifDate = new Date(notification.timestamp);
      if (notifDate >= today) {
        groups.today.push(notification);
      } else if (notifDate >= yesterday && notifDate < today) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });
    
    return groups;
  };
  
  const notificationGroups = groupNotifications();
  
  const renderNotificationItem = (notification: any) => (
    <DropdownMenuItem
      key={notification.id}
      className={cn(
        "flex items-start p-3 cursor-pointer group", 
        !notification.read ? 'bg-muted/60' : ''
      )}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex gap-3 w-full">
        {notification.sender?.avatar ? (
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={notification.sender.avatar} alt={notification.sender.name || ''} />
            <AvatarFallback className="bg-primary/10">
              {notification.sender.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="rounded-full bg-muted p-2 h-9 w-9 flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        )}
        
        <div className="flex-1 space-y-1 min-w-0">
          <p className="text-sm leading-tight font-medium line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center">
          {!notification.read && (
            <div className="mr-2">
              <Badge variant="secondary" className="ml-auto">
                {t('notifications.unread')}
              </Badge>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => handleDeleteNotification(e, notification.id)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Delete notification</span>
          </Button>
        </div>
      </div>
    </DropdownMenuItem>
  );
  
  return (
    <>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center p-4 border-b">
          <span className="text-lg font-semibold">{t('notifications.all')}</span>
          <div className="flex space-x-1">
            {!isNotificationPermissionGranted && 'Notification' in window && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNotificationPermission} 
                className="h-8 text-xs"
                title="Enable push notifications"
              >
                <Bell className="h-3 w-3 mr-1" />
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                <Check className="h-3 w-3 mr-1" />
                {t('notifications.markAllRead')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAllNotifications} 
              className="h-8 text-xs"
              title="Clear all notifications"
            >
              <Trash2 className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <DropdownMenuGroup>
              {notificationGroups.today.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Today
                  </div>
                  {notificationGroups.today.map(renderNotificationItem)}
                </>
              )}
              
              {notificationGroups.yesterday.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Yesterday
                  </div>
                  {notificationGroups.yesterday.map(renderNotificationItem)}
                </>
              )}
              
              {notificationGroups.older.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Older
                  </div>
                  {notificationGroups.older.map(renderNotificationItem)}
                </>
              )}
            </DropdownMenuGroup>
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground opacity-25 mb-3" />
              <p className="text-sm font-medium">{t('notifications.empty')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                You don't have any notifications yet
              </p>
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="py-2 justify-center font-medium text-primary text-center"
          onClick={() => {
            navigate('/notifications');
            if (onClose) onClose();
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your notifications from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAllNotifications}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationMenu;
