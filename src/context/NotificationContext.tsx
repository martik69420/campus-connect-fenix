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

// Define the structure of a notification
export interface Notification {
  id: string;
  type: 'message' | 'like' | 'friend' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
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
  const [showLikeNotifications, setShowLikeNotifications] = useState(true);
  const [showFriendNotifications, setShowFriendNotifications] = useState(true);
  const [showSystemNotifications, setShowSystemNotifications] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate the number of unread notifications
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Function to fetch notifications (replace with your actual data fetching logic)
  const fetchNotifications = useCallback(async () => {
    // Simulate fetching notifications from an API or database
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'message',
        message: 'You have a new message from John Doe',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'like',
        message: 'Your post received a like from Jane Smith',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '3',
        type: 'friend',
        message: 'You have a new friend request from Alice',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '4',
        type: 'system',
        message: 'Welcome to our platform!',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Simulate new notifications arriving every 10 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Function to mark a notification as read
  const markAsRead = async (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Display a toast notification
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      toast({
        title: 'New Notification',
        description: notification.message,
        action: (
          <ToastAction altText="View" onClick={() => navigate('/notifications')}>
            View
          </ToastAction>
        ),
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
