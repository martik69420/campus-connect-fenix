
import React, { useState } from 'react';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, UserMinus, MoreVertical, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import OnlineStatus from '@/components/OnlineStatus';

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastActive?: string;
  isOnline?: boolean;
  school?: string;
}

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
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  
  const handleRemoveFriend = async () => {
    if (!selectedFriendId) return;
    
    setRemovingFriend(selectedFriendId);
    try {
      await onRemoveFriend(selectedFriendId);
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setRemovingFriend(null);
      setConfirmDialogOpen(false);
    }
  };
  
  const openRemoveDialog = (friendId: string) => {
    setSelectedFriendId(friendId);
    setConfirmDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You haven't added any friends yet. Find people from your school and connect with them.
        </p>
        <Button asChild>
          <Link to="/add-friends">Find Friends</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend, index) => (
        <motion.div 
          key={friend.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${friend.username}`} 
                  className="flex items-center space-x-4 flex-1"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-transparent">
                      <AvatarImage src={friend.avatar || '/placeholder.svg'} alt={friend.displayName} />
                      <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <OnlineStatus userId={friend.id} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{friend.displayName}</p>
                      <OnlineStatus userId={friend.id} className="ml-2" showLabel />
                    </div>
                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                    {friend.school && <p className="text-xs text-muted-foreground">{friend.school}</p>}
                  </div>
                </Link>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={() => onMessageFriend(friend.id)}
                    title="Message"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${friend.username}`}>View Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => openRemoveDialog(friend.id)}
                        disabled={removingFriend === friend.id}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        <span>
                          {removingFriend === friend.id ? 'Removing...' : 'Remove Friend'}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
            
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveFriend}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removingFriend ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FriendsList;
