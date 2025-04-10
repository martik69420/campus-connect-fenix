
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
}

interface UseMessagesResult {
  messages: Message[];
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const useMessages = (userId: string | undefined): UseMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user?.id},sender_id.eq.${userId}`)
          .or(`receiver_id.eq.${user?.id},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: true });

        if (error) {
          setError(error.message);
        } else if (data) {
          setMessages(data as Message[]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up a real-time subscription to listen for new messages
    const messagesSubscription = supabase
      .channel('custom-all-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new) {
            // Properly type the payload as a Message
            const newMsg = payload.new as Message;
            
            // Optimistically update the messages array
            setMessages((prevMessages) => {
              // Check if the new message involves the current user and the target user
              if (
                (newMsg.sender_id === user?.id && newMsg.receiver_id === userId) ||
                (newMsg.sender_id === userId && newMsg.receiver_id === user?.id)
              ) {
                return [...prevMessages, newMsg];
              }
              return prevMessages;
            });
          }
        }
      )
      .subscribe();

    // Unsubscribe when the component unmounts
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [userId, user?.id]);

  const sendMessage = async (receiverId: string, content: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          { sender_id: user?.id, receiver_id: receiverId, content: content },
        ]);

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const markAsRead = async (messageId: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { messages, sendMessage, markAsRead, loading, error };
};

export default useMessages;
