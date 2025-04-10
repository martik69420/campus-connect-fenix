
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { MessageCircle, UserX, Loader2, Users } from 'lucide-react';

interface Friend {
  id: string;
  profiles: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemoveFriend: (friendshipId: string) => Promise<void>;
  onMessageFriend: (friendId: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ 
  friends, 
  loading, 
  onRemoveFriend,
  onMessageFriend
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredFriends = searchTerm 
    ? friends.filter(friend => 
        friend.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.profiles.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : friends;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Your Friends</CardTitle>
          <div className="relative max-w-xs w-full">
            <Input
              placeholder="Search friends..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFriends.length > 0 ? (
          <div className="space-y-4">
            {filteredFriends.map((friend) => (
              <motion.div 
                key={friend.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.profiles.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {friend.profiles.display_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{friend.profiles.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{friend.profiles.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onMessageFriend(friend.profiles.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/profile/${friend.profiles.username}`)}
                  >
                    View Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemoveFriend(friend.id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No friends yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Find people from your school and connect with them
            </p>
            <Button onClick={() => navigate('/add-friends')}>Find Friends</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendsList;
