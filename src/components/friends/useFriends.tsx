
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define the profile type used in friends
export interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

// Friend type definition
export interface Friend {
  id: string;
  status: string;
  created_at: string;
  friend_id: string;
  profiles: FriendProfile;
}

// Friend request type definition
export interface FriendRequest {
  id: string;
  status: string;
  created_at: string;
  user_id?: string;
  friend_id?: string;
  profiles: FriendProfile;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch friends and friend requests
  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Fetch accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id, 
          status, 
          created_at, 
          friend_id,
          profiles:profiles!friends_friend_id_fkey(id, display_name, username, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;
      
      // Fetch received friend requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('friends')
        .select(`
          id, 
          status, 
          created_at, 
          user_id,
          profiles:profiles!friends_user_id_fkey(id, display_name, username, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;
      
      // Fetch sent friend requests
      const { data: sentData, error: sentError } = await supabase
        .from('friends')
        .select(`
          id, 
          status, 
          created_at, 
          friend_id,
          profiles:profiles!friends_friend_id_fkey(id, display_name, username, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Process the data before updating state to fix TypeScript errors
      const processedFriends = friendsData.map(friend => ({
        ...friend,
        profiles: friend.profiles as unknown as FriendProfile
      }));
      
      const processedReceivedRequests = receivedData.map(request => ({
        ...request,
        profiles: request.profiles as unknown as FriendProfile
      }));
      
      const processedSentRequests = sentData.map(request => ({
        ...request,
        profiles: request.profiles as unknown as FriendProfile
      }));
      
      setFriends(processedFriends);
      setReceivedRequests(processedReceivedRequests);
      setSentRequests(processedSentRequests);
    } catch (error: any) {
      console.error('Error fetching friends:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load friends. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Send friend request
  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: friendId, status: 'pending' }
        ]);

      if (error) throw error;
      
      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent successfully.',
      });
      
      // Refetch to update the UI
      fetchFriends();
    } catch (error: any) {
      console.error('Error sending friend request:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to send friend request. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, fetchFriends]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      // Update the request status to accepted
      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create a reciprocal friend relationship
      const request = receivedRequests.find(req => req.id === requestId);
      
      if (request && user?.id) {
        const { error: insertError } = await supabase
          .from('friends')
          .insert([
            { user_id: user.id, friend_id: request.user_id, status: 'accepted' }
          ]);

        if (insertError) throw insertError;
      }
      
      toast({
        title: 'Friend request accepted',
        description: 'You are now friends!',
      });
      
      // Refetch to update the UI
      fetchFriends();
    } catch (error: any) {
      console.error('Error accepting friend request:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, receivedRequests, fetchFriends]);

  // Reject/cancel friend request
  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: 'Request removed',
        description: 'The friend request has been removed.',
      });
      
      // Refetch to update the UI
      fetchFriends();
    } catch (error: any) {
      console.error('Error rejecting friend request:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to reject friend request. Please try again.',
        variant: 'destructive',
      });
    }
  }, [fetchFriends]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    if (!user?.id) return;
    
    try {
      // Delete both directions of the friendship
      await Promise.all([
        supabase
          .from('friends')
          .delete()
          .eq('user_id', user.id)
          .eq('friend_id', friendId),
        supabase
          .from('friends')
          .delete()
          .eq('user_id', friendId)
          .eq('friend_id', user.id)
      ]);
      
      toast({
        title: 'Friend removed',
        description: 'You have removed this friend from your list.',
      });
      
      // Refetch to update the UI
      fetchFriends();
    } catch (error: any) {
      console.error('Error removing friend:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to remove friend. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, fetchFriends]);

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
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    fetchFriends
  };
};

export default useFriends;
