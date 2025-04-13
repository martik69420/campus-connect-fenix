import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserX, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FriendRequest } from '@/components/friends/useFriends';

export interface SentRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onCancel: (requestId: string) => Promise<void>;
}

const SentRequestsTab: React.FC<SentRequestsTabProps> = ({
  requests,
  loading,
  onCancel
}) => {
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  const handleCancel = async (requestId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await onCancel(requestId);
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <UserX className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Sent Requests</h3>
          <p className="text-muted-foreground mt-1">
            You haven't sent any friend requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {(request.profiles?.display_name || "?").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{request.profiles?.display_name || "Unknown User"}</h3>
                  <p className="text-sm text-muted-foreground">@{request.profiles?.username || "unknown"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCancel(request.id)}
                disabled={processingRequests[request.id]}
              >
                {processingRequests[request.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SentRequestsTab;
