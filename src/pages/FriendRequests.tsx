
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FriendRequestsTab from '@/components/friends/FriendRequestsTab';
import SentRequestsTab from '@/components/friends/SentRequestsTab';

const FriendRequests: React.FC = () => {
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
                <FriendRequestsTab />
              </TabsContent>
              
              <TabsContent value="sent" className="space-y-4">
                <SentRequestsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FriendRequests;
