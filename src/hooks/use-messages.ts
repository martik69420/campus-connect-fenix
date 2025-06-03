
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

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend:profiles!friendships_friend_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      const friendsList = data?.map(friendship => ({
        id: friendship.friend.id,
        username: friendship.friend.username,
        displayName: friendship.friend.display_name || friendship.friend.username,
        avatar: friendship.friend.avatar_url
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
