
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, UserMinus, RefreshCw, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { Friend } from './types';

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onMessageFriend: (friendId: string) => void;
  onRetry?: () => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ 
  friends, 
  loading, 
  onRemoveFriend, 
  onMessageFriend,
  onRetry
}) => {
  const { t } = useLanguage();
  
  const handleRemove = async (id: string) => {
    await onRemoveFriend(id);
  };
  
  const handleMessage = (id: string) => {
    onMessageFriend(id);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4 mt-2">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <UserX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('friends.noFriends')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('friends.noFriendsDescription')}
          </p>
          <Button onClick={() => window.location.href = '/add-friends'}>
            {t('friends.findFriends')}
          </Button>
          
          {onRetry && (
            <Button 
              variant="ghost" 
              className="mt-2 gap-2" 
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('friends.yourFriends')}</h2>
          
          {onRetry && (
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1" 
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.refresh')}
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {friends.map((friend) => (
            <div 
              key={friend.id} 
              className="flex items-center justify-between p-3 bg-card hover:bg-muted/30 rounded-lg border border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name} />
                  <AvatarFallback>{friend.display_name?.charAt(0) || friend.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{friend.display_name || friend.username}</h3>
                  <p className="text-sm text-muted-foreground">@{friend.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleMessage(friend.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(friend.id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsList;
