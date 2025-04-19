
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, ArrowRight, RefreshCw, UserX, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

interface FriendSuggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  mutual_friends?: number;
}

const FriendsForYou: React.FC = () => {
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Add loading timeout to prevent infinite spinner
  useEffect(() => {
    if (isLoading && !loadingTimeout) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingTimeout]);

  // Function to fetch suggestions - separated so we can call it directly
  const fetchFriendSuggestions = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get friend suggestions with pagination
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .range(offset, offset + 4)
        .limit(5);
        
      if (error) throw error;
      
      let filteredUsers = users || [];
      
      // If no users found with current offset, reset to 0 and try again
      if (filteredUsers.length === 0 && offset > 0) {
        setOffset(0);
        return; // Will trigger another fetch through the dependency change
      }
      
      // Filter out users that are already friends
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', user.id);
        
      const { data: friendRequests } = await supabase
        .from('friends')
        .select('user_id, status')
        .eq('friend_id', user.id);
        
      const friendIds = new Set([
        ...(friends?.map(f => f.friend_id) || []),
        ...(friendRequests?.map(f => f.user_id) || [])
      ]);
      
      // Add mutual friends count and filter out existing friends
      const enhancedUsers = filteredUsers
        .filter(u => !friendIds.has(u.id))
        .map(user => ({
          ...user,
          mutual_friends: Math.floor(Math.random() * 5) + 1, // Simulate mutual friends
        }));
        
      if (enhancedUsers.length === 0 && offset === 0) {
        // If we still have no suggestions at offset 0, increment to try more users
        setOffset(prev => prev + 5);
        return;
      }
      
      setFriendSuggestions(enhancedUsers);
    } catch (error: any) {
      console.error('Error fetching friend suggestions:', error);
      setError(error.message || 'Failed to load friend suggestions');
      
      // Fallback to mock data if there's an error
      provideFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  // Provide fallback data if there's an error
  const provideFallbackData = () => {
    const fallbackUsers = [
      {
        id: '1',
        username: 'emilyjones',
        display_name: 'Emily Jones',
        avatar_url: 'https://i.pravatar.cc/150?img=1',
        mutual_friends: 3,
      },
      {
        id: '2',
        username: 'alexchen',
        display_name: 'Alex Chen',
        avatar_url: 'https://i.pravatar.cc/150?img=3',
        mutual_friends: 2,
      },
      {
        id: '3',
        username: 'sarahpatel',
        display_name: 'Sarah Patel',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
        mutual_friends: 4,
      },
    ];
    
    setFriendSuggestions(fallbackUsers);
  };

  // Initial fetch + refetch when dependencies change
  useEffect(() => {
    fetchFriendSuggestions();
  }, [user?.id, refreshKey, offset]);

  const handleFollow = async (userId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: userId, status: 'pending' }
        ]);
        
      if (error) throw error;
      
      toast({
        title: "Friend request sent",
        description: "They will be notified of your request."
      });
      
      // Remove user from suggestions
      const updatedSuggestions = friendSuggestions.filter(u => u.id !== userId);
      setFriendSuggestions(updatedSuggestions);
      
      // If all friends are added, fetch new suggestions
      if (updatedSuggestions.length === 0) {
        fetchNewSuggestions();
      }
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchNewSuggestions = () => {
    // Increase offset to get new users
    setOffset(prev => prev + 5);
    // Reset suggestions while loading
    setFriendSuggestions([]);
    // Trigger refetch
    setRefreshKey(prev => prev + 1);
    // Reset loading timeout
    setLoadingTimeout(false);
    // Show toast
    toast({
      title: "Finding new friends",
      description: "Loading new friend suggestions for you"
    });
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleRetryAfterTimeout = () => {
    setLoadingTimeout(false);
    fetchFriendSuggestions();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('friends.forYou')}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchNewSuggestions}
          disabled={isLoading}
          className="p-1 h-8 w-8 rounded-full"
          aria-label="Refresh suggestions"
          title={t('friends.findNew')}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">{t('friends.refresh')}</span>
        </Button>
      </div>
      
      {isLoading ? (
        loadingTimeout ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <UserX className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-muted-foreground font-medium mb-2">{t('friends.loadingTimeout')}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRetryAfterTimeout}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex justify-between items-center animate-pulse">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {error && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-destructive font-medium mb-2">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchFriendSuggestions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.retry')}
              </Button>
            </div>
          )}
          
          {!error && friendSuggestions.length > 0 ? (
            <div className="space-y-4">
              {friendSuggestions.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center"
                >
                  <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => handleViewProfile(friend.username)}
                  >
                    <Avatar>
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>{friend.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {friend.mutual_friends} {t('friends.mutualFriends')}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => handleFollow(friend.id)}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {t('friends.connect')}
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : !error && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground font-medium">{t('friends.noSuggestions')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={fetchNewSuggestions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('friends.findNewSuggestions')}
              </Button>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full group"
          onClick={() => navigate('/add-friends')}
        >
          {t('friends.findMore')}
          <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </>
  );
};

export default FriendsForYou;
