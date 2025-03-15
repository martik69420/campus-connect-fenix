
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/context/AuthContext';

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!chatPartnerId || !userId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching messages between ${userId} and ${chatPartnerId}`);
        
        // Use parameterized query format
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .or(`sender_id.eq.${chatPartnerId},receiver_id.eq.${chatPartnerId}`)
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

        // Filter messages to only include those between the user and chat partner
        const filteredMessages = data?.filter(msg => 
          (msg.sender_id === userId && msg.receiver_id === chatPartnerId) || 
          (msg.sender_id === chatPartnerId && msg.receiver_id === userId)
        ) || [];

        console.log('Fetched messages:', filteredMessages);
        setMessages(filteredMessages);
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
      .channel('messages-channel-' + chatPartnerId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${chatPartnerId}),and(sender_id.eq.${chatPartnerId},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          console.log('Realtime message update:', payload);
          if (payload.eventType === 'INSERT') {
            // Add new message to the list
            setMessages((current) => [...current, payload.new as Message]);
            
            // Mark as read if we're the receiver
            if (payload.new.receiver_id === userId) {
              markMessageAsRead(payload.new.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing message
            setMessages((current) => 
              current.map(msg => 
                msg.id === payload.new.id ? payload.new as Message : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    console.log('Subscribed to messages channel for', chatPartnerId);

    return () => {
      console.log('Unsubscribing from messages channel');
      supabase.removeChannel(channel);
    };
  }, [chatPartnerId, userId, toast, isAuthenticated]);

  const sendMessage = async (content: string) => {
    if (!chatPartnerId || !userId || !content.trim() || !isAuthenticated) {
      console.error('Cannot send message: missing required data or not authenticated');
      toast({
        title: 'Error sending message',
        description: 'Missing required data or not authenticated',
        variant: 'destructive'
      });
      return null;
    }

    try {
      console.log('Sending message from', userId, 'to', chatPartnerId, ':', content);
      
      // Make sure IDs are strings to match RLS policy expectations
      const { data, error } = await supabase.from('messages').insert({
        sender_id: userId.toString(),
        receiver_id: chatPartnerId.toString(),
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
        return null;
      } else {
        console.log('Message sent successfully:', data);
        return data[0];
      }
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!isAuthenticated) {
      console.error('Cannot mark message as read: not authenticated');
      return;
    }
    
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
    if (!chatPartnerId || !userId || !isAuthenticated) {
      console.error('Cannot mark messages as read: missing required data or not authenticated');
      return;
    }
    
    try {
      console.log('Marking all messages from', chatPartnerId, 'as read');
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', chatPartnerId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
        
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };

  return { messages, isLoading, sendMessage, markMessagesAsRead };
};
