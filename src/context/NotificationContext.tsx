
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PushNotificationService from '@/services/PushNotificationService';

// Define the structure of a notification
export interface Notification {
  id: string;
  type: 'message' | 'like' | 'friend' | 'system' | 'comment' | 'mention' | 'coin';
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  url?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Define the context properties
export interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  showMessageNotifications: boolean;
  showLikeNotifications: boolean;
  showFriendNotifications: boolean;
  showSystemNotifications: boolean;
  toggleMessageNotifications: () => void;
  toggleLikeNotifications: () => void;
  toggleFriendNotifications: () => void;
  toggleSystemNotifications: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  isNotificationPermissionGranted: boolean;
  enableAutomaticNotifications: (enable: boolean) => void;
  deleteNotification: (id: string) => Promise<void>;
}

// Create the context with a default value
const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

// Notification Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showMessageNotifications, setShowMessageNotifications] = 
    useState(true);
  const [showLikeNotifications, setShowLikeNotifications] = useState(false);
  const [showFriendNotifications, setShowFriendNotifications] = useState(true);
  const [showSystemNotifications, setShowSystemNotifications] = useState(false);
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const pushNotificationService = PushNotificationService.getInstance();

  // By default, we want to focus on friend-related notifications
  useEffect(() => {
    pushNotificationService.setAutomaticNotifications(true);
  }, []);

  // Calculate the number of unread and coin notifications
  const unreadCount = notifications.filter((notification) => 
    !notification.read && (notification.type === 'friend' || notification.type === 'mention')
  ).length;

  // Check notification permission on component mount
  useEffect(() => {
    // Only check if browser supports Notification API
    if ('Notification' in window) {
      setIsNotificationPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Request permission for push notifications
  const requestNotificationPermission = async () => {
    const granted = await pushNotificationService.requestPermission();
    setIsNotificationPermissionGranted(granted);
    return granted;
  };

  // Function to enable or disable automatic notifications
  const enableAutomaticNotifications = (enable: boolean) => {
    pushNotificationService.setAutomaticNotifications(enable);
  };

  // Function to fetch notifications (replace with your actual data fetching logic)
  const fetchNotifications = useCallback(async () => {
    // Try to fetch from database if user is authenticated
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          const formattedNotifications: Notification[] = data.map(n => ({
            id: n.id,
            type: n.type as any,
            message: n.content,
            timestamp: n.created_at,
            read: n.is_read,
            relatedId: n.related_id,
            url: n.url
          }));
          
          setNotifications(formattedNotifications);
          return;
        }
      }

      // Fallback to mock data if no authenticated user
      const mockNotifications: Notification[] = [
        {
          id: '3',
          type: 'friend',
          message: 'You have a new friend request from Alice',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          read: false,
          relatedId: 'user789',
          url: '/friends',
          sender: {
            id: 'user789',
            name: 'Alice Cooper',
            avatar: 'https://i.pravatar.cc/150?u=user789',
          }
        },
        {
          id: '4',
          type: 'mention',
          message: 'Alex mentioned you in a post',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          read: false,
          relatedId: 'post123',
          url: '/posts/post123',
          sender: {
            id: 'user456',
            name: 'Alex Johnson',
            avatar: 'https://i.pravatar.cc/150?u=user456',
          }
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Fall back to empty array in case of error
      setNotifications([]);
    }
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up subscription for realtime notifications
    const notificationsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Refresh notifications when there's a change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [fetchNotifications]);

  // Process new notifications for push notification
  useEffect(() => {
    // Find unread notifications and show push notification for them
    const unreadNotifications = notifications.filter(
      notification => !notification.read && 
        (notification.type === 'friend' || 
         (notification.type === 'message' && showMessageNotifications) ||
         (notification.type === 'mention'))
    );
    
    if (unreadNotifications.length > 0) {
      // Only show the most recent unread notification as a push notification
      const latestNotification = unreadNotifications[0];
      
      // Process notification based on its type and user's preferences
      const shouldShow = 
        (latestNotification.type === 'mention') || 
        (latestNotification.type === 'friend' && showFriendNotifications) ||
        (latestNotification.type === 'message' && showMessageNotifications);
        
      if (shouldShow) {
        pushNotificationService.processNotification(latestNotification);
      }
    }
  }, [notifications, showMessageNotifications, showFriendNotifications]);

  // Function to mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update in database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Display a toast notification
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        toast({
          title: `New ${notification.type} notification`,
          description: notification.message,
          action: notification.url ? (
            <ToastAction altText="View" onClick={() => navigate(notification.url || '/')}>
              View
            </ToastAction>
          ) : undefined,
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update in database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false);
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Function to delete a single notification
  const deleteNotification = async (id: string) => {
    try {
      // Delete from database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
      
      toast({
        title: "Notification deleted",
        description: "The notification has been permanently removed."
      });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to clear all notifications
  const clearAllNotifications = async () => {
    try {
      // Delete from database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', session.user.id);
          
        if (error) throw error;
      }
      
      // Update local state
      setNotifications([]);
      
      toast({
        title: "Notifications cleared",
        description: "All notifications have been permanently removed."
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Toggle message notifications
  const toggleMessageNotifications = () => {
    setShowMessageNotifications((prev) => !prev);
  };

  // Toggle like notifications
  const toggleLikeNotifications = () => {
    setShowLikeNotifications((prev) => !prev);
  };

  // Toggle friend notifications
  const toggleFriendNotifications = () => {
    setShowFriendNotifications((prev) => !prev);
  };

  // Toggle system notifications
  const toggleSystemNotifications = () => {
    setShowSystemNotifications((prev) => !prev);
  };

  // Provide the context value
  const value: NotificationContextProps = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    showMessageNotifications,
    showLikeNotifications,
    showFriendNotifications,
    showSystemNotifications,
    toggleMessageNotifications,
    toggleLikeNotifications,
    toggleFriendNotifications,
    toggleSystemNotifications,
    requestNotificationPermission,
    isNotificationPermissionGranted,
    enableAutomaticNotifications,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
