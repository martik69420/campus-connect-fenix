
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Notification type
export type Notification = {
  id: string;
  userId: string;
  type: "like" | "comment" | "friend" | "mention" | "system" | "coin";
  message: string;
  createdAt: Date;
  read: boolean;
  relatedId?: string; // Post ID, user ID, etc.
  data?: any; // Additional data
};

// Context type
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Sample notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    userId: "1",
    type: "like",
    message: "Jane Smith liked your post",
    createdAt: new Date(Date.now() - 1800000),
    read: false,
    relatedId: "2",
  },
  {
    id: "n2",
    userId: "1",
    type: "comment",
    message: "Alex Johnson commented on your post",
    createdAt: new Date(Date.now() - 3600000),
    read: false,
    relatedId: "2",
  },
  {
    id: "n3",
    userId: "1",
    type: "system",
    message: "Welcome to Campus Fenix! Complete your profile to earn 50 coins.",
    createdAt: new Date(Date.now() - 7200000),
    read: true,
  },
  {
    id: "n4",
    userId: "1",
    type: "coin",
    message: "You earned 10 coins for creating a post",
    createdAt: new Date(Date.now() - 86400000),
    read: true,
  }
];

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const { user } = useAuth();

  // Filter notifications for current user
  const userNotifications = user 
    ? notifications.filter(notif => notif.userId === user.id)
    : [];
  
  // Count unread notifications
  const unreadCount = userNotifications.filter(notif => !notif.read).length;

  // Add a new notification
  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => 
      user && notif.userId === user.id ? { ...notif, read: true } : notif
    ));
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications(notifications.filter(notif => 
      !user || notif.userId !== user.id
    ));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        unreadCount,
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
