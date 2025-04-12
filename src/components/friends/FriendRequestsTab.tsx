
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Loader2, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface FriendRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (requestId: string) => Promise<boolean>;
  onDecline: (requestId: string) => Promise<boolean>;
}

const FriendRequestsTab: React.FC<FriendRequestsTabProps> = ({
  requests,
  loading,
  onAccept,
  onDecline
}) => {
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  const handleAccept = async (requestId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await onAccept(requestId);
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await onDecline(requestId);
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
          <h3 className="text-lg font-medium">No Friend Requests</h3>
          <p className="text-muted-foreground mt-1">
            You don't have any pending friend requests.
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
                  <AvatarImage src={request.user.avatar} />
                  <AvatarFallback>
                    {request.user.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{request.user.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{request.user.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequests[request.id]}
                >
                  {processingRequests[request.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDecline(request.id)}
                  disabled={processingRequests[request.id]}
                >
                  {processingRequests[request.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FriendRequestsTab;
