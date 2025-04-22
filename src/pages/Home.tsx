
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { useFriends } from '@/components/friends/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FriendsForYou from '@/components/users/FriendsForYou';
import { useAuth } from '@/context/auth';

const Home: React.FC = () => {
  const { friends, isLoading: friendsLoading } = useFriends();
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <Index />
        </div>
        
        {user && (
          <div className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Connection Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <FriendsForYou />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Home;
