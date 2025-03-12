
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const useMessages = (chatPartnerId: string | null, userId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatPartnerId || !userId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${chatPartnerId}),and(sender_id.eq.${chatPartnerId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        setMessages(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId},receiver_id=eq.${chatPartnerId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${chatPartnerId},receiver_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatPartnerId, userId]);

  const sendMessage = async (content: string) => {
    if (!chatPartnerId || !userId || !content.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: chatPartnerId,
        content: content.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chatPartnerId || !userId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .match({ sender_id: chatPartnerId, receiver_id: userId, is_read: false });
        
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };

  return { messages, isLoading, sendMessage, markMessagesAsRead };
};
