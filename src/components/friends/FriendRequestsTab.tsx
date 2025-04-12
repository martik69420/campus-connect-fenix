import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { User } from '@/context/auth/types';

interface FriendRequestTabProps {
  requests: User[];
  loading: boolean;
  onAccept: (userId: string) => Promise<void>;
  onDecline: (userId: string) => Promise<void>;
}

const FriendRequestsTab: React.FC<FriendRequestTabProps> = ({ requests, loading, onAccept, onDecline }) => {
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
              <AvatarImage src={request.avatar || ""} alt={request.displayName || "Friend"} />
              <AvatarFallback>{request.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.displayName || request.username}</p>
              <p className="text-sm text-muted-foreground">@{request.username}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onAccept(request.id)}>
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDecline(request.id)}>
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
