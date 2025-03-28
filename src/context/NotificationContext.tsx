import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'like' | 'comment' | 'friend_request' | 'message' | 'coin' | 'system';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  url?: string;
  isRead: boolean;
  read: boolean; // Added for compatibility
  message: string; // Added for compatibility
  createdAt: Date;
  relatedId?: string;
}

interface NotificationFilters {
  showCoinNotifications: boolean;
  showLikeNotifications: boolean;
  showCommentNotifications: boolean;
  showMessageNotifications: boolean;
  showSystemNotifications: boolean;
  showFriendNotifications: boolean;
  showSystemNotifications: boolean;
}

interface NotificationContextProps {
  notifications: Notification[];
  hasUnread: boolean;
  unreadCount: number; // Added missing property
  isLoading: boolean;
  filters: NotificationFilters;
  toggleFilter: (type: keyof NotificationFilters) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>; // Added missing property
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const defaultFilters: NotificationFilters = {
  showCoinNotifications: false,
  showLikeNotifications: true,
  showCommentNotifications: true,
  showFriendNotifications: true,
  showMessageNotifications: true,
  showSystemNotifications: true,
};

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Add unreadCount state
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>(defaultFilters);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load notification preferences from localStorage or set defaults
  useEffect(() => {
    const savedFilters = localStorage.getItem('notificationFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Error parsing saved notification filters:', error);
        setFilters(defaultFilters);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationFilters', JSON.stringify(filters));
  }, [filters]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNumber = 1, pageSize = 10) => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedNotifications: Notification[] = data.map(notification => ({
          id: notification.id,
          userId: notification.user_id,
          type: notification.type as NotificationType,
          content: notification.content,
          message: notification.content, // Map content to message for compatibility
          url: notification.url || undefined,
          isRead: notification.is_read,
          read: notification.is_read, // Map is_read to read for compatibility
          createdAt: new Date(notification.created_at),
          relatedId: notification.related_id || undefined,
        }));

        if (pageNumber === 1) {
          // Replace all notifications on first page
          setNotifications(formattedNotifications);
        } else {
          // Append notifications on subsequent pages
          setNotifications(prev => [...prev, ...formattedNotifications]);
        }

        setHasMore(data.length === pageSize);
        
        // Check if there are any unread notifications
        const unreadNotifications = formattedNotifications.filter(notif => !notif.isRead);
        setHasUnread(unreadNotifications.length > 0);
        setUnreadCount(unreadNotifications.length); // Update unreadCount
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    setPage(1);
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    await fetchNotifications(nextPage);
    setPage(nextPage);
  }, [fetchNotifications, isLoading, hasMore, page]);

  // Filter toggle
  const toggleFilter = useCallback((type: keyof NotificationFilters) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Check if we still have unread notifications
      setHasUnread(prev => {
        if (!prev) return false;
        return notifications.some(notif => notif.id !== notificationId && !notif.isRead);
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id, notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );

      setHasUnread(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Don't show coin notifications if filter is disabled
          if (newNotification.type === 'coin' && !filters.showCoinNotifications) {
            return;
          }
          
          const formattedNotification: Notification = {
            id: newNotification.id,
            userId: newNotification.user_id,
            type: newNotification.type as NotificationType,
            content: newNotification.content,
            message: newNotification.content, // Map content to message for compatibility
            url: newNotification.url || undefined,
            isRead: newNotification.is_read,
            read: newNotification.is_read, // Map is_read to read for compatibility
            createdAt: new Date(newNotification.created_at),
            relatedId: newNotification.related_id || undefined,
          };

          // Add to notifications list
          setNotifications(prev => [formattedNotification, ...prev]);
          
          // Set unread flag
          if (!newNotification.is_read) {
            setHasUnread(true);
          }
          
          // Show toast notification based on type
          if (
            (formattedNotification.type === 'like' && filters.showLikeNotifications) ||
            (formattedNotification.type === 'comment' && filters.showCommentNotifications) ||
            (formattedNotification.type === 'friend_request' && filters.showFriendNotifications) ||
            (formattedNotification.type === 'message' && filters.showMessageNotifications) ||
            (formattedNotification.type === 'system' && filters.showSystemNotifications)
          ) {
            toast({
              title: getNotificationTitle(formattedNotification.type),
              description: formattedNotification.content,
              action: formattedNotification.url
                ? {
                    label: 'View',
                    onClick: () => {
                      window.location.href = formattedNotification.url || '';
                    },
                  }
                : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, filters]);

  // Initial fetch
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    if (notification.type === 'coin' && !filters.showCoinNotifications) return false;
    if (notification.type === 'like' && !filters.showLikeNotifications) return false;
    if (notification.type === 'comment' && !filters.showCommentNotifications) return false;
    if (notification.type === 'friend_request' && !filters.showFriendNotifications) return false;
    if (notification.type === 'message' && !filters.showMessageNotifications) return false;
    if (notification.type === 'system' && !filters.showSystemNotifications) return false;
    return true;
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications: filteredNotifications,
        hasUnread,
        unreadCount, // Add unreadCount to the context value
        isLoading,
        filters,
        toggleFilter,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        fetchNotifications, // Add fetchNotifications to the context value
        hasMore,
        loadMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions
function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case 'like':
      return 'New Like';
    case 'comment':
      return 'New Comment';
    case 'friend_request':
      return 'Friend Request';
    case 'message':
      return 'New Message';
    case 'coin':
      return 'Coins Earned';
    case 'system':
      return 'System Notification';
    default:
      return 'Notification';
  }
}
