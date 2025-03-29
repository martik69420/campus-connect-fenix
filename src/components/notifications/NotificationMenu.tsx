
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare, Heart, Check, UserPlus, User, Megaphone, Coins, AtSign } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';

const NotificationMenu = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotification();
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
      case 'coin':
        return <Coins className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  return (
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel className="flex justify-between items-center">
        <span>{t('notifications.all')}</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
            <Check className="h-3 w-3 mr-1" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <ScrollArea className="h-[300px]">
        {notifications.length > 0 ? (
          <DropdownMenuGroup>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-tight">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge variant="secondary" className="ml-auto">{t('notifications.unread')}</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
          </div>
        )}
      </ScrollArea>
    </DropdownMenuContent>
  );
};

export default NotificationMenu;
