
import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useFriends } from '@/components/friends/useFriends';
import FriendsList from '@/components/friends/FriendsList';
import AdBanner from '@/components/ads/AdBanner';
import { User, UserPlus, UserCheck, Users, Loader2 } from 'lucide-react';

// Optimized lazy loading for less used tabs
const FriendRequestsTab = lazy(() => import('@/components/friends/FriendRequestsTab'));
const SentRequestsTab = lazy(() => import('@/components/friends/SentRequestsTab'));

const Friends = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    isLoading, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend,
    sendFriendRequest 
  } = useFriends();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleMessageFriend = (friendId: string) => {
    navigate(`/messages?userId=${friendId}`);
  };
  
  // Helper functions to convert the Promise<boolean> to Promise<void>
  const handleRemoveFriend = async (friendId: string): Promise<void> => {
    await removeFriend(friendId);
  };

  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    await acceptFriendRequest(requestId);
  };

  const handleRejectRequest = async (requestId: string): Promise<void> => {
    await rejectFriendRequest(requestId);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* AdSense Ad at the top of the page */}
      <AdBanner adSlot="5082313008" />
    
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground">Connect with your campus community</p>
        </div>
        <Button onClick={() => navigate('/add-friends')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Friends
        </Button>
      </div>
      
      <Tabs defaultValue="all-friends" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all-friends">
            <Users className="mr-2 h-4 w-4" />
            All Friends
          </TabsTrigger>
          <TabsTrigger value="pending">
            <UserCheck className="mr-2 h-4 w-4" />
            Requests
            {receivedRequests.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {receivedRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <UserPlus className="mr-2 h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-friends">
          <FriendsList 
            friends={friends}
            loading={isLoading}
            onRemoveFriend={handleRemoveFriend}
            onMessageFriend={handleMessageFriend}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <Suspense fallback={
            <Card>
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          }>
            <FriendRequestsTab 
              requests={receivedRequests}
              loading={isLoading}
              onAccept={handleAcceptRequest}
              onDecline={handleRejectRequest}
            />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="sent">
          <Suspense fallback={
            <Card>
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          }>
            <SentRequestsTab 
              requests={sentRequests}
              loading={isLoading} 
              onCancel={handleRejectRequest}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
      
      {/* AdSense Ad at the bottom of the page */}
      <AdBanner adSlot="2813542194" className="mt-8" />
    </div>
  );
};

export default Friends;
