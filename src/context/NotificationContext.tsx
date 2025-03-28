
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Notification type
export type Notification = {
  id: string;
  userId: string;
  type: "like" | "comment" | "friend" | "mention" | "system" | "coin" | "message";
  message: string;
  createdAt: Date;
  read: boolean;
  relatedId?: string; // Post ID, user ID, etc.
  url?: string; // Optional URL to navigate to
  data?: any; // Additional data
};

// Context type
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const formattedNotifications: Notification[] = data.map(notif => ({
          id: notif.id,
          userId: notif.user_id,
          type: notif.type as any,
          message: notif.content,
          createdAt: new Date(notif.created_at),
          read: notif.is_read,
          relatedId: notif.related_id,
          url: notif.url
        }));
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('notification-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              const newNotif = payload.new as any;
              
              const notification: Notification = {
                id: newNotif.id,
                userId: newNotif.user_id,
                type: newNotif.type,
                message: newNotif.content,
                createdAt: new Date(newNotif.created_at),
                read: newNotif.is_read,
                relatedId: newNotif.related_id,
                url: newNotif.url
              };
              
              setNotifications(prev => [notification, ...prev]);
              
              // Show toast for real-time notifications
              toast({
                title: getNotificationTypeTitle(newNotif.type),
                description: newNotif.content,
              });
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  // Helper function to get title based on notification type
  const getNotificationTypeTitle = (type: string): string => {
    switch (type) {
      case 'like': return 'New Like';
      case 'comment': return 'New Comment';
      case 'friend': return 'Friend Request';
      case 'mention': return 'Mention';
      case 'message': return 'New Message';
      case 'coin': return 'Coins Earned';
      case 'system': return 'System Notification';
      default: return 'Notification';
    }
  };

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          content: notification.message,
          related_id: notification.relatedId,
          url: notification.url,
          is_read: false
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      if (data) {
        // New notification will be added via the realtime subscription
      }
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Clear notifications
  const clearNotifications = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
