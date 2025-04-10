
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Friend {
  id: string;
  profiles: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface FriendRequest {
  id: string;
  profiles: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchFriends = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Execute all queries in parallel for performance
      const [friendsResponse, reverseFriendsResponse, receivedResponse, sentResponse] = await Promise.all([
        // Get friends where user is user_id
        supabase.from('friends')
          .select('id, status, created_at, friend_id, profiles:friend_id (*)')
          .eq('user_id', user.id)
          .eq('status', 'friends'),
          
        // Get friends where user is friend_id
        supabase.from('friends')
          .select('id, status, created_at, user_id, profiles:user_id (*)')
          .eq('friend_id', user.id)
          .eq('status', 'friends'),
          
        // Get pending requests received
        supabase.from('friends')
          .select('id, status, created_at, user_id, profiles:user_id (*)')
          .eq('friend_id', user.id)
          .eq('status', 'pending'),
          
        // Get pending requests sent
        supabase.from('friends')
          .select('id, status, created_at, friend_id, profiles:friend_id (*)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
      ]);
      
      if (friendsResponse.error) throw friendsResponse.error;
      if (reverseFriendsResponse.error) throw reverseFriendsResponse.error;
      if (receivedResponse.error) throw receivedResponse.error;
      if (sentResponse.error) throw sentResponse.error;
      
      // Combine both friend lists (where user is user_id and where user is friend_id)
      const allFriends = [
        ...(friendsResponse.data || []),
        ...(reverseFriendsResponse.data || []).map(item => ({
          ...item,
          friend_id: item.user_id,
          profiles: item.profiles
        }))
      ];
      
      setFriends(allFriends);
      setPendingRequests(receivedResponse.data || []);
      setSentRequests(sentResponse.data || []);
      
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Failed to load friends",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'friends' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request accepted" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const declineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request declined" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to decline request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);
        
      if (error) throw error;
      
      toast({ title: "Friend removed" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request cancelled" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to cancel request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, fetchFriends]);
  
  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    fetchFriends,
    acceptRequest,
    declineRequest,
    removeFriend,
    cancelRequest
  };
}
