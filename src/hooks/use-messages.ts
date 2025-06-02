
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  sendMessage: (receiverId: string, content: string) => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const useMessages = (currentUserId: string, contactId: string): UseMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages between current user and contact
  const fetchMessages = async () => {
    if (!currentUserId || !contactId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setMessages(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (receiverId: string, content: string): Promise<Message | null> => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content,
        }])
        .select('*')
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Mark message as read
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

  // Load messages when dependencies change
  useEffect(() => {
    if (currentUserId && contactId) {
      fetchMessages();
    }
  }, [currentUserId, contactId]);

  return { messages, sendMessage, markAsRead, loading, error };
};

export default useMessages;
