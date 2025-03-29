
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotification();
  const { t } = useLanguage();
  
  // Refresh notifications when dialog opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);
  
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    onOpenChange(false);
    
    // Navigate based on notification type and url
    if (notification.url) {
      navigate(notification.url);
    } else if (notification.relatedId && notification.type === 'like') {
      navigate(`/posts/${notification.relatedId}`);
    } else if (notification.relatedId && notification.type === 'comment') {
      navigate(`/posts/${notification.relatedId}`);
    } else if (notification.relatedId && notification.type === 'friend') {
      navigate(`/profile/${notification.relatedId}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <div className="rounded-full bg-red-500/10 p-2 text-red-500">❤️</div>;
      case 'comment':
        return <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">💬</div>;
      case 'friend':
        return <div className="rounded-full bg-green-500/10 p-2 text-green-500">👋</div>;
      case 'mention':
        return <div className="rounded-full bg-purple-500/10 p-2 text-purple-500">@</div>;
      case 'message':
        return <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">✉️</div>;
      case 'system':
        return <div className="rounded-full bg-orange-500/10 p-2 text-orange-500">📢</div>;
      case 'coin':
        return <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-500">🪙</div>;
      default:
        return <div className="rounded-full bg-gray-500/10 p-2 text-gray-500">🔔</div>;
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b sticky top-0 bg-background z-10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">{t('notifications.all')}</DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                <Check className="h-3 w-3 mr-1" />
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {notifications.length > 0 ? (
            <div className="py-1">
              {notificationGroups.today.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Today
                  </div>
                  {notificationGroups.today.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex items-start p-3 cursor-pointer hover:bg-accent/50 ${!notification.read ? 'bg-muted/60' : ''}`}
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
                          <div className="rounded-full h-9 w-9 flex items-center justify-center">
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
                        
                        {!notification.read && (
                          <div className="ml-2 flex-shrink-0">
                            <Badge variant="secondary" className="ml-auto">
                              {t('notifications.unread')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {notificationGroups.yesterday.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Yesterday
                  </div>
                  {notificationGroups.yesterday.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex items-start p-3 cursor-pointer hover:bg-accent/50 ${!notification.read ? 'bg-muted/60' : ''}`}
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
                          <div className="rounded-full h-9 w-9 flex items-center justify-center">
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
                        
                        {!notification.read && (
                          <div className="ml-2 flex-shrink-0">
                            <Badge variant="secondary" className="ml-auto">
                              {t('notifications.unread')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {notificationGroups.older.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Older
                  </div>
                  {notificationGroups.older.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex items-start p-3 cursor-pointer hover:bg-accent/50 ${!notification.read ? 'bg-muted/60' : ''}`}
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
                          <div className="rounded-full h-9 w-9 flex items-center justify-center">
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
                        
                        {!notification.read && (
                          <div className="ml-2 flex-shrink-0">
                            <Badge variant="secondary" className="ml-auto">
                              {t('notifications.unread')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
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
        
        <DialogFooter className="flex justify-center p-3 border-t">
          <Button 
            variant="ghost" 
            className="w-full text-primary"
            onClick={() => {
              onOpenChange(false);
              navigate('/notifications');
            }}
          >
            View all notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;
