
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';

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
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to trigger refetches
  const [offset, setOffset] = useState(0); // Add pagination offset for fetching new suggestions
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFriendSuggestions = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Get friend suggestions based on mutual connections with pagination
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .range(offset, offset + 4) // Fetch 5 users at a time
          .limit(5);
          
        if (error) throw error;
        
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
        
        // Add mutual friends count (simulated for now)
        const enhancedUsers = users
          ?.filter(u => !friendIds.has(u.id))
          .map(user => ({
            ...user,
            mutual_friends: Math.floor(Math.random() * 5) + 1, // Simulate 1-5 mutual friends
          })) || [];
          
        setFriendSuggestions(enhancedUsers);
      } catch (error) {
        console.error('Error fetching friend suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
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
    // Show toast
    toast({
      title: "Finding new friends",
      description: "Loading new friend suggestions for you"
    });
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // Fallback data in case there are no suggestions from the database
  const fallbackFriends = [
    {
      id: '1',
      username: 'sarahparker',
      display_name: 'Sarah Parker',
      avatar_url: 'https://i.pravatar.cc/150?img=23',
      mutual_friends: 3,
    },
    {
      id: '2',
      username: 'mikejohnson',
      display_name: 'Mike Johnson',
      avatar_url: 'https://i.pravatar.cc/150?img=33',
      mutual_friends: 2,
    },
    {
      id: '3',
      username: 'annawilson',
      display_name: 'Anna Wilson',
      avatar_url: 'https://i.pravatar.cc/150?img=9',
      mutual_friends: 4,
    },
  ];

  // Use fallback data if no suggestions from database
  const displayFriends = friendSuggestions.length > 0 ? friendSuggestions : fallbackFriends;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Friends For You</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchNewSuggestions}
          disabled={isLoading}
          className="p-1 h-8 w-8 rounded-full"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh suggestions</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-16 bg-muted rounded mt-2"></div>
                </div>
              </div>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayFriends.map((friend, index) => (
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
                    {friend.mutual_friends} mutual friends
                  </p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => handleFollow(friend.id)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Connect
              </Button>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full group"
          onClick={() => navigate('/add-friends')}
        >
          Find more friends
          <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </>
  );
};

export default FriendsForYou;
