import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, CoinsIcon, Heart, MessageSquare, RefreshCw, UserPlus, BellOff } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

type Notification = {
  id: string;
  type: string;
  content: string;
  created_at: string;
  is_read: boolean;
  related_id?: string;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestNotificationPermission, isNotificationPermissionGranted } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkUserAndFetchNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      fetchNotifications();
    };
    
    checkUserAndFetchNotifications();
    
    // Set up realtime subscription for new notifications
    const notificationsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Add the new notification to the list
          setNotifications(prevNotifications => [payload.new as Notification, ...prevNotifications]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching notifications",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) {
        toast({
          title: "No unread notifications",
          description: "All notifications are already marked as read",
        });
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Navigate to the post
      if (notification.related_id) {
        // In a real app, you would navigate to the specific post
        // For now, we'll just go to the home page
        navigate('/');
      }
    } else if (notification.type === 'friend_request') {
      // Navigate to the profile page of the person who sent the request
      // For simplicity, just go to notifications for now
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'coins':
        return <CoinsIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Older
      return date.toLocaleDateString();
    }
  };

  const handleEnablePushNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "Push notifications enabled",
        description: "You will now receive notifications when the app is in the background",
      });
    } else {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <div className="flex space-x-2">
            {!isNotificationPermissionGranted && 'Notification' in window && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEnablePushNotifications}
                className="flex items-center gap-1"
              >
                <Bell className="h-4 w-4" />
                Enable Push
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshNotifications} 
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        </div>

        {!('Notification' in window) && (
          <div className="mb-4 p-4 border rounded-lg bg-muted flex items-center">
            <BellOff className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in your browser
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`
                  flex items-start space-x-4 p-4 border rounded-lg cursor-pointer 
                  ${notification.is_read ? 'bg-background' : 'bg-secondary'}
                  transition-colors duration-200 hover:border-primary/30
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="rounded-full bg-muted p-2">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`${notification.is_read ? 'text-foreground' : 'text-foreground font-medium'}`}>
                    {notification.content}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No notifications yet</h3>
            <p className="text-muted-foreground mt-1">
              When you receive notifications, they'll appear here.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
