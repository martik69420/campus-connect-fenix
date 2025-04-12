
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth';
import { useNotification } from '@/context/NotificationContext';
import { ClearAllButton } from '@/components/notifications/ClearAllButton';
import { useViewport } from '@/hooks/use-viewport';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markAllAsRead, fetchNotifications } = useNotification();
  const [activeTab, setActiveTab] = useState<string>('all');
  const { isMobile } = useViewport();
  
  useEffect(() => {
    if (user) {
      markAllAsRead();
    }
  }, [user, markAllAsRead]);
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread' 
      ? notifications.filter(n => !n.read) 
      : notifications.filter(n => n.type === activeTab);
  
  const handleClearSuccess = () => {
    // Reload notifications after clearing
    if (fetchNotifications) {
      fetchNotifications();
    }
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-2xl">Notifications</CardTitle>
              <CardDescription>
                Stay updated with activity on your account
              </CardDescription>
            </div>
            {user && (
              <ClearAllButton userId={user.id} onSuccess={handleClearSuccess} />
            )}
          </CardHeader>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="like">Likes</TabsTrigger>
                <TabsTrigger value="comment">Comments</TabsTrigger>
                <TabsTrigger value="friend">Friends</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="pt-4 px-2">
              <TabsContent value={activeTab} className="focus-visible:outline-none">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} notifications to display</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-md ${
                          notification.read ? 'bg-background' : 'bg-primary/5'
                        } hover:bg-muted transition-colors`}
                      >
                        <div className="flex gap-3 items-start">
                          {notification.sender?.avatar && (
                            <img
                              src={notification.sender.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-grow">
                            <p className={`${!notification.read ? 'font-medium' : ''}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
