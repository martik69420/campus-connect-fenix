
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FriendRequestsTab from '@/components/friends/FriendRequestsTab';
import SentRequestsTab from '@/components/friends/SentRequestsTab';
import { useFriends } from '@/components/friends/useFriends';

const FriendRequests: React.FC = () => {
  const { 
    receivedRequests, 
    sentRequests, 
    isLoading, 
    acceptFriendRequest, 
    rejectFriendRequest
  } = useFriends();

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Friend Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="received">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="received" className="space-y-4">
                <FriendRequestsTab 
                  requests={receivedRequests}
                  loading={isLoading}
                  onAccept={async (userId) => { await acceptFriendRequest(userId); }}
                  onDecline={async (userId) => { await rejectFriendRequest(userId); }}
                />
              </TabsContent>
              
              <TabsContent value="sent" className="space-y-4">
                <SentRequestsTab 
                  requests={sentRequests}
                  loading={isLoading}
                  onCancel={rejectFriendRequest}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FriendRequests;
