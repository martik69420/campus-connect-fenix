
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface UseMessagesResult {
  friends: Friend[];
  messages: Message[];
  loading: boolean;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  fetchMessages: (contactId: string) => Promise<void>;
  fetchFriends: () => Promise<void>;
}

export const useMessages = (): UseMessagesResult => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get the friend relationships
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        return;
      }

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Get the friend IDs
      const friendIds = friendsData.map(f => f.friend_id);

      // Then, get the profile data for those friends
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        return;
      }

      const friendsList = profilesData?.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name || profile.username,
        avatar: profile.avatar_url
      })) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: receiverId,
          content: content,
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Add the new message to the current messages
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  return {
    friends,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends
  };
};

export default useMessages;
