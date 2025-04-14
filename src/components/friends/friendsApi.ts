
import { supabase } from '@/integrations/supabase/client';
import { Friend, FriendRequest } from './types';

// Fetch all friends for a user
export const fetchFriendsData = async (userId: string): Promise<Friend[]> => {
  try {
    // Query for both directions of friendship
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        profiles!friends_friend_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          school
        ),
        users_profiles:profiles!friends_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          school
        )
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    // Transform the data to get consistent friend objects
    const friends: Friend[] = data.map((friendRelation) => {
      // Determine which user is the friend (not the current user)
      const isUserIdField = friendRelation.user_id === userId;
      const friendProfile = isUserIdField ? friendRelation.profiles : friendRelation.users_profiles;
      
      if (!friendProfile) return null;
      
      // Create a friend object with consistent properties
      return {
        id: friendProfile.id,
        username: friendProfile.username,
        displayName: friendProfile.display_name,
        avatar: friendProfile.avatar_url,
        school: friendProfile.school,
        isOnline: false, // Default to false, would come from user_status table
      };
    }).filter(Boolean) as Friend[];
    
    return friends;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
};

// Fetch received friend requests
export const fetchReceivedRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        status,
        user:profiles!friends_user_id_fkey (
          id, username, display_name, avatar_url, school
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching received requests:', error);
    return [];
  }
};

// Fetch sent friend requests
export const fetchSentRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        status,
        friend:profiles!friends_friend_id_fkey (
          id, username, display_name, avatar_url, school
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    return [];
  }
};

// Send a friend request
export const sendFriendRequest = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    // Check if a request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(friend_id.eq.${userId},user_id.eq.${friendId})`)
      .limit(1);
      
    if (checkError) throw checkError;
    
    if (existingRequest && existingRequest.length > 0) {
      console.log('Friend request already exists');
      return false;
    }
    
    // Insert new friend request
    const { error } = await supabase
      .from('friends')
      .insert([
        { user_id: userId, friend_id: friendId, status: 'pending' },
      ]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (
  requestId: string, 
  userId: string,
  friendId: string | undefined
): Promise<boolean> => {
  try {
    if (!friendId) return false;
    
    // Update the status of the request
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
      
    if (error) throw error;
    
    // Create a notification for the other user
    try {
      await supabase.from('notifications').insert([{
        user_id: friendId,
        type: 'friend_request_accepted',
        content: 'accepted your friend request',
        related_id: userId,
        url: `/profile/${userId}`
      }]);
    } catch (notificationError) {
      // Log but don't fail the request
      console.error('Error creating notification:', notificationError);
    }
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

// Reject/cancel a friend request
export const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Delete the request
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
};

// Remove a friend
export const removeFriend = async (friendId: string, userId: string): Promise<boolean> => {
  try {
    // Delete from both directions
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(friend_id.eq.${userId},user_id.eq.${friendId})`);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};
