
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, UserMinus, Loader2, Users } from 'lucide-react';
import { Friend } from '@/components/friends/useFriends';

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onMessageFriend: (friendId: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  loading,
  onRemoveFriend,
  onMessageFriend
}) => {
  const [processingFriends, setProcessingFriends] = useState<Record<string, boolean>>({});
  
  const handleRemoveFriend = async (friendId: string) => {
    setProcessingFriends(prev => ({ ...prev, [friendId]: true }));
    try {
      await onRemoveFriend(friendId);
    } finally {
      setProcessingFriends(prev => ({ ...prev, [friendId]: false }));
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

  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Friends Yet</h3>
          <p className="text-muted-foreground mt-1">
            You don't have any friends yet. Start connecting with people!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <Card key={friend.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={friend.profiles.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {friend.profiles.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-medium">{friend.profiles.display_name}</h3>
                  <p className="text-sm text-muted-foreground">@{friend.profiles.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => onMessageFriend(friend.friend_id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRemoveFriend(friend.id)}
                  disabled={processingFriends[friend.id]}
                >
                  {processingFriends[friend.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserMinus className="h-4 w-4 mr-2" />
                  )}
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FriendsList;
