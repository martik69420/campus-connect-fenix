
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FriendRequest } from './useFriends';

interface FriendRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

const FriendRequestsTab: React.FC<FriendRequestsTabProps> = ({ 
  requests, 
  loading, 
  onAccept, 
  onDecline 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.div 
                key={request.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.profiles.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {request.profiles.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{request.profiles.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onAccept(request.id)}
                  >
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDecline(request.id)}
                  >
                    Decline
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pending requests</h3>
            <p className="text-muted-foreground mt-1">
              You don't have any pending friend requests
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendRequestsTab;
