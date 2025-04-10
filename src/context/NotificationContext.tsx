
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

  // By default, we want to focus on coin-related notifications
  useEffect(() => {
    pushNotificationService.setAutomaticNotifications(true);
  }, []);

  // Calculate the number of unread and coin notifications
  const unreadCount = notifications.filter((notification) => 
    !notification.read && (notification.type === 'coin' || notification.type === 'friend')
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
    // Simulate fetching notifications from an API or database
    const mockNotifications: Notification[] = [
      {
        id: '7',
        type: 'coin',
        message: 'You earned 50 coins for completing a challenge!',
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
        read: false,
      },
      {
        id: '8',
        type: 'coin',
        message: 'You earned 25 coins for daily login!',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        read: false,
      },
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
        id: '9',
        type: 'coin',
        message: 'You earned 100 coins for your first post!',
        timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Simulate new notifications arriving every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Process new notifications for push notification
  useEffect(() => {
    // Find unread notifications and show push notification for them
    const unreadNotifications = notifications.filter(
      notification => !notification.read && 
        (notification.type === 'coin' || notification.type === 'friend' || 
         (notification.type === 'message' && showMessageNotifications))
    );
    
    if (unreadNotifications.length > 0) {
      // Only show the most recent unread notification as a push notification
      const latestNotification = unreadNotifications[0];
      
      // Process notification based on its type and user's preferences
      const shouldShow = 
        (latestNotification.type === 'coin') || 
        (latestNotification.type === 'friend' && showFriendNotifications) ||
        (latestNotification.type === 'message' && showMessageNotifications);
        
      if (shouldShow) {
        pushNotificationService.processNotification(latestNotification);
      }
    }
  }, [notifications, showMessageNotifications, showFriendNotifications]);

  // Function to mark a notification as read
  const markAsRead = async (id: string) => {
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
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
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
    enableAutomaticNotifications
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
