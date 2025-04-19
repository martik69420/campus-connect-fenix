
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { Friend, FriendRequest, FriendProfile } from './types';
import { 
  fetchFriendsData, 
  fetchReceivedRequests, 
  fetchSentRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend 
} from './friendsApi';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type { Friend, FriendRequest, FriendProfile } from './types';

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch friends and friend requests
  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [friendsData, receivedData, sentData] = await Promise.all([
        fetchFriendsData(user.id),
        fetchReceivedRequests(user.id),
        fetchSentRequests(user.id)
      ]);
      
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
    } catch (error: any) {
      console.error('Error in fetchFriends:', error);
      setError(error.message || 'Failed to load friends data');
      toast({
        title: "Error loading friends",
        description: "Could not load your friends. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Set up real-time subscription for friend status updates
  useEffect(() => {
    if (!user?.id) return;

    let retryCount = 0;
    const maxRetries = 3;
    
    const setupChannel = () => {
      try {
        // Subscribe to friend status changes
        const channel = supabase
          .channel('friends-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'friends',
              filter: `user_id=eq.${user.id},friend_id=eq.${user.id}`
            },
            () => {
              // Refresh friends list when changes occur
              fetchFriends();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to friends changes');
            } else if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying subscription, attempt ${retryCount}`);
              setTimeout(setupChannel, 2000 * retryCount);
            }
          });
          
        return channel;
      } catch (err) {
        console.error('Error setting up friends channel:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying subscription setup, attempt ${retryCount}`);
          setTimeout(setupChannel, 2000 * retryCount);
        }
        return null;
      }
    };

    const channel = setupChannel();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, fetchFriends]);

  // Handle sending friend request
  const handleSendFriendRequest = useCallback(async (friendId: string): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const success = await sendFriendRequest(user.id, friendId);
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend request sent",
          description: "Your friend request has been sent successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error sending friend request",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  }, [user?.id, fetchFriends, toast]);

  // Handle accepting friend request
  const handleAcceptFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const request = receivedRequests.find(req => req.id === requestId);
      const success = await acceptFriendRequest(requestId, user.id, request?.user_id);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend request accepted",
          description: "You are now friends!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error accepting friend request",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    }
  }, [user?.id, receivedRequests, fetchFriends, toast]);

  // Handle rejecting/canceling friend request
  const handleRejectFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    try {
      const success = await rejectFriendRequest(requestId);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Request removed",
          description: "The friend request has been removed",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error removing friend request",
        description: error.message || "Failed to remove friend request",
        variant: "destructive",
      });
    }
  }, [fetchFriends, toast]);

  // Handle removing friend
  const handleRemoveFriend = useCallback(async (friendId: string): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const success = await removeFriend(friendId, user.id);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend removed",
          description: "The friend has been removed from your list",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error removing friend",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    }
  }, [user?.id, fetchFriends, toast]);

  // Load friends when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id, fetchFriends]);

  return {
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    error,
    sendFriendRequest: handleSendFriendRequest,
    acceptFriendRequest: handleAcceptFriendRequest,
    rejectFriendRequest: handleRejectFriendRequest,
    removeFriend: handleRemoveFriend,
    fetchFriends
  };
};

export default useFriends;
