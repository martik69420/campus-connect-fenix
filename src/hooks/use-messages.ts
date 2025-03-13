
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    if (!chatPartnerId || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        // Use parameters instead of string interpolation to avoid SQL injection
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${chatPartnerId}),and(sender_id.eq.${chatPartnerId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          toast({
            title: 'Error loading messages',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        console.log('Fetched messages between', userId, 'and', chatPartnerId, ':', data);
        setMessages(data || []);
      } catch (error: any) {
        console.error('Error in fetchMessages:', error);
        toast({
          title: 'Error loading messages',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up Realtime subscription for messages
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Received sender message:', payload.new);
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Received receiver message:', payload.new);
          setMessages((current) => [...current, payload.new as Message]);
          // Automatically mark messages as read when received
          markMessageAsRead(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Message updated:', payload.new);
          setMessages((current) => 
            current.map(msg => 
              msg.id === payload.new.id ? payload.new as Message : msg
            )
          );
        }
      )
      .subscribe();

    console.log('Subscribed to messages channel');

    return () => {
      console.log('Unsubscribing from messages channel');
      supabase.removeChannel(channel);
    };
  }, [chatPartnerId, userId, toast]);

  const sendMessage = async (content: string) => {
    if (!chatPartnerId || !userId || !content.trim()) return;

    try {
      console.log('Sending message from', userId, 'to', chatPartnerId, ':', content);
      const { data, error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: chatPartnerId,
        content: content.trim(),
        is_read: false
      }).select();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error sending message',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        console.log('Message sent successfully:', data);
      }
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      console.log('Marking message as read:', messageId);
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
        
      if (error) {
        console.error('Error marking message as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chatPartnerId || !userId) return;
    
    try {
      console.log('Marking all messages from', chatPartnerId, 'as read');
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
