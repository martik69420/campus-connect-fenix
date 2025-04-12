
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { User } from '@/context/auth/types';
import { FriendRequest } from '@/components/friends/useFriends';

interface FriendRequestTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (userId: string) => Promise<void>;
  onDecline: (userId: string) => Promise<void>;
}

const FriendRequestsTab: React.FC<FriendRequestTabProps> = ({ requests, loading, onAccept, onDecline }) => {
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  const handleAccept = async (requestId: string, userId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await onAccept(userId);
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDecline = async (requestId: string, userId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await onDecline(userId);
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return <p>Loading friend requests...</p>;
  }

  if (!requests || requests.length === 0) {
    return <p>No friend requests to display.</p>;
  }

  return (
    <ul>
      {requests.map((request) => (
        <li key={request.id} className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={request.user.avatar || ""} alt={request.user.displayName || "Friend"} />
              <AvatarFallback>{request.user.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.user.displayName || request.user.username}</p>
              <p className="text-sm text-muted-foreground">@{request.user.username}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleAccept(request.id, request.user.id)}
              disabled={processingRequests[request.id]}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDecline(request.id, request.user.id)}
              disabled={processingRequests[request.id]}
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default FriendRequestsTab;
