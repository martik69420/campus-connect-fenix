
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

export { Friend, FriendRequest } from './types';
export type { FriendProfile } from './types';

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
      // Fetch all data in parallel
      const [friendsData, receivedData, sentData] = await Promise.all([
        fetchFriendsData(user.id),
        fetchReceivedRequests(user.id),
        fetchSentRequests(user.id)
      ]);
      
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
    } catch (error) {
      console.error('Error in fetchFriends:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Handle sending friend request
  const handleSendFriendRequest = useCallback(async (friendId: string): Promise<void> => {
    if (!user?.id) return;
    
    const success = await sendFriendRequest(user.id, friendId);
    if (success) {
      // Refetch to update the UI
      fetchFriends();
    }
  }, [user?.id, fetchFriends]);

  // Handle accepting friend request
  const handleAcceptFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!user?.id) return;
    
    const request = receivedRequests.find(req => req.id === requestId);
    const success = await acceptFriendRequest(requestId, user.id, request?.user_id);
    
    if (success) {
      // Refetch to update the UI
      fetchFriends();
    }
  }, [user?.id, receivedRequests, fetchFriends]);

  // Handle rejecting/canceling friend request
  const handleRejectFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    const success = await rejectFriendRequest(requestId);
    
    if (success) {
      // Refetch to update the UI
      fetchFriends();
    }
  }, [fetchFriends]);

  // Handle removing friend
  const handleRemoveFriend = useCallback(async (friendId: string): Promise<void> => {
    if (!user?.id) return;
    
    const success = await removeFriend(friendId, user.id);
    
    if (success) {
      // Refetch to update the UI
      fetchFriends();
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
    sendFriendRequest: handleSendFriendRequest,
    acceptFriendRequest: handleAcceptFriendRequest,
    rejectFriendRequest: handleRejectFriendRequest,
    removeFriend: handleRemoveFriend,
    fetchFriends
  };
};

export default useFriends;
