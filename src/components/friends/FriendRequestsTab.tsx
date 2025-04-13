
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { FriendRequest } from '@/components/friends/types';

interface FriendRequestTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

const FriendRequestsTab: React.FC<FriendRequestTabProps> = ({ requests, loading, onAccept, onDecline }) => {
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
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <div className="text-muted-foreground">
            <X className="h-10 w-10 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No friend requests</h3>
            <p className="mt-1">You have no pending friend requests at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{(request.profiles?.display_name || "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{request.profiles?.display_name || "Unknown User"}</h3>
                  <p className="text-sm text-muted-foreground">@{request.profiles?.username || "unknown"}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequests[request.id]}
                  size="sm"
                >
                  {processingRequests[request.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDecline(request.id)}
                  disabled={processingRequests[request.id]}
                >
                  <X className="h-4 w-4 mr-2" />
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
