
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FriendsForYou from '@/components/users/FriendsForYou';
import { useAuth } from '@/context/auth';
import { UserPlus } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row gap-6">
        {user && (
          <div className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-primary" />
                  Friends For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FriendsForYou />
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="flex-1">
          <Index />
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
