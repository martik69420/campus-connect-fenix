
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
}

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  lastActive?: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load friends and requests
  useEffect(() => {
    if (user) {
      loadFriendsData();
    }
  }, [user]);
  
  const loadFriendsData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Load friends
      await loadFriends();
      
      // Load received requests
      await loadReceivedRequests();
      
      // Load sent requests
      await loadSentRequests();
      
    } catch (error) {
      console.error("Error loading friends data:", error);
      toast({
        title: "Error",
        description: "Failed to load friends data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFriends = async () => {
    if (!user) return;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      // In a real app, you would fetch from your database
      setFriends([
        {
          id: '1',
          username: 'johndoe',
          displayName: 'John Doe',
          avatar: '/avatars/john.jpg',
          isOnline: true
        },
        {
          id: '2',
          username: 'janedoe',
          displayName: 'Jane Doe',
          avatar: '/avatars/jane.jpg',
          isOnline: false,
          lastActive: '2023-04-10T15:42:00Z'
        }
      ]);
    } catch (error) {
      console.error("Error loading friends:", error);
      throw error;
    }
  };
  
  const loadReceivedRequests = async () => {
    if (!user) return;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      setReceivedRequests([
        {
          id: 'req1',
          user: {
            id: '3',
            username: 'michaelscott',
            displayName: 'Michael Scott',
            avatar: '/avatars/michael.jpg'
          },
          createdAt: '2023-04-11T10:30:00Z'
        }
      ]);
    } catch (error) {
      console.error("Error loading received requests:", error);
      throw error;
    }
  };
  
  const loadSentRequests = async () => {
    if (!user) return;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      setSentRequests([
        {
          id: 'sent1',
          user: {
            id: '4',
            username: 'pambeesly',
            displayName: 'Pam Beesly',
            avatar: '/avatars/pam.jpg'
          },
          createdAt: '2023-04-12T09:15:00Z'
        }
      ]);
    } catch (error) {
      console.error("Error loading sent requests:", error);
      throw error;
    }
  };
  
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return false;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent."
      });
      
      // Optimistically update the UI
      const newRequest = {
        id: `sent-${Date.now()}`,
        user: {
          id: friendId,
          username: 'newuser',
          displayName: 'New User',
        },
        createdAt: new Date().toISOString()
      };
      
      setSentRequests(prev => [...prev, newRequest]);
      
      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return false;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      toast({
        title: "Friend request accepted",
        description: "You are now friends."
      });
      
      // Find the request to accept
      const request = receivedRequests.find(req => req.id === requestId);
      
      if (request) {
        // Add to friends
        setFriends(prev => [...prev, {
          id: request.user.id,
          username: request.user.username,
          displayName: request.user.displayName,
          avatar: request.user.avatar,
          isOnline: false
        }]);
        
        // Remove from requests
        setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      }
      
      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return false;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected."
      });
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Also check and remove from sent requests (for cancel functionality)
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      
      return true;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const removeFriend = async (friendId: string) => {
    if (!user) return false;
    
    try {
      // This is just a mock implementation - replace with actual Supabase queries
      toast({
        title: "Friend removed",
        description: "This person has been removed from your friends list."
      });
      
      // Remove from friends
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      
      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  return {
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriends: loadFriendsData
  };
};
