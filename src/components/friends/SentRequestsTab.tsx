
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FriendRequest } from './useFriends';

interface SentRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onCancel: (requestId: string) => Promise<void>;
}

const SentRequestsTab: React.FC<SentRequestsTabProps> = ({ 
  requests, 
  loading, 
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent Requests</CardTitle>
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onCancel(request.id)}
                >
                  Cancel Request
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sent requests</h3>
            <p className="text-muted-foreground mt-1">
              You haven't sent any friend requests yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentRequestsTab;
