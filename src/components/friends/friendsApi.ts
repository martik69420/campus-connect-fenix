
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Friend, FriendRequest, FriendProfile } from './types';

/**
 * Fetch accepted friends for a user
 */
export const fetchFriendsData = async (userId: string) => {
  try {
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select(`
        id, 
        status, 
        created_at, 
        friend_id,
        profiles:profiles!friends_friend_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (friendsError) throw friendsError;
    
    // Process the data to fix TypeScript errors
    const processedFriends = friendsData.map(friend => ({
      ...friend,
      profiles: friend.profiles as unknown as FriendProfile
    }));
    
    return processedFriends;
  } catch (error: any) {
    console.error('Error fetching friends:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to load friends. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
};

/**
 * Fetch received friend requests for a user
 */
export const fetchReceivedRequests = async (userId: string) => {
  try {
    const { data: receivedData, error: receivedError } = await supabase
      .from('friends')
      .select(`
        id, 
        status, 
        created_at, 
        user_id,
        profiles:profiles!friends_user_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (receivedError) throw receivedError;
    
    const processedReceivedRequests = receivedData.map(request => ({
      ...request,
      profiles: request.profiles as unknown as FriendProfile
    }));
    
    return processedReceivedRequests;
  } catch (error: any) {
    console.error('Error fetching received friend requests:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to load friend requests. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
};

/**
 * Fetch sent friend requests for a user
 */
export const fetchSentRequests = async (userId: string) => {
  try {
    const { data: sentData, error: sentError } = await supabase
      .from('friends')
      .select(`
        id, 
        status, 
        created_at, 
        friend_id,
        profiles:profiles!friends_friend_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (sentError) throw sentError;
    
    const processedSentRequests = sentData.map(request => ({
      ...request,
      profiles: request.profiles as unknown as FriendProfile
    }));
    
    return processedSentRequests;
  } catch (error: any) {
    console.error('Error fetching sent friend requests:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to load sent friend requests. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
};

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friends')
      .insert([
        { user_id: userId, friend_id: friendId, status: 'pending' }
      ]);

    if (error) throw error;
    
    toast({
      title: 'Friend request sent',
      description: 'Your friend request has been sent successfully.',
    });
    
    return true;
  } catch (error: any) {
    console.error('Error sending friend request:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to send friend request. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string, userId: string, requestUserId?: string): Promise<boolean> => {
  try {
    // Update the request status to accepted
    const { error: updateError } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Create a reciprocal friend relationship if we have the user ID
    if (requestUserId && userId) {
      const { error: insertError } = await supabase
        .from('friends')
        .insert([
          { user_id: userId, friend_id: requestUserId, status: 'accepted' }
        ]);

      if (insertError) throw insertError;
    }
    
    toast({
      title: 'Friend request accepted',
      description: 'You are now friends!',
    });
    
    return true;
  } catch (error: any) {
    console.error('Error accepting friend request:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to accept friend request. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};

/**
 * Reject/cancel friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
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
    
    return true;
  } catch (error: any) {
    console.error('Error rejecting friend request:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to reject friend request. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};

/**
 * Remove friend
 */
export const removeFriend = async (friendId: string, userId: string): Promise<boolean> => {
  try {
    // Delete both directions of the friendship
    await Promise.all([
      supabase
        .from('friends')
        .delete()
        .eq('id', friendId),
      supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', userId)
    ]);
    
    toast({
      title: 'Friend removed',
      description: 'You have removed this friend from your list.',
    });
    
    return true;
  } catch (error: any) {
    console.error('Error removing friend:', error.message);
    toast({
      title: 'Error',
      description: 'Failed to remove friend. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};
