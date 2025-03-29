
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
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Clear optimistic messages when chat partner changes
  useEffect(() => {
    setOptimisticMessages([]);
  }, [chatPartnerId]);

  useEffect(() => {
    if (!chatPartnerId || !userId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching messages between ${userId} and ${chatPartnerId}`);
        
        // Modified query to properly get conversation between two users
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

        console.log('Fetched messages:', data);
        setMessages(data || []);
        
        // Mark received messages as read
        const unreadMessages = data?.filter(msg => 
          msg.sender_id === chatPartnerId && 
          msg.receiver_id === userId && 
          !msg.is_read
        ) || [];
        
        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(msg => 
              markMessageAsRead(msg.id)
            )
          );
        }
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

    // Set up Realtime subscription for messages with improved filter
    const channel = supabase
      .channel(`messages-channel-${chatPartnerId}-${userId}`)
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
            setMessages((current) => {
              // Check if message already exists
              if (current.some(msg => msg.id === payload.new.id)) {
                return current;
              }
              return [...current, payload.new as Message];
            });
            
            // Remove any optimistic message that might match this one
            setOptimisticMessages(current => 
              current.filter(msg => !msg.id.startsWith('temp-'))
            );
            
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
      return null;
    }

    try {
      const trimmedContent = content.trim();
      
      // Create optimistic message with unique ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: userId,
        receiver_id: chatPartnerId,
        content: trimmedContent,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Add optimistic message immediately
      setOptimisticMessages(prev => [...prev, optimisticMessage]);
      
      // Send actual message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: chatPartnerId,
          content: trimmedContent
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId));
        toast({
          title: 'Error sending message',
          description: error.message,
          variant: 'destructive'
        });
        return null;
      }
      
      // Remove the optimistic message once real message is confirmed
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      return data?.[0] || null;
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
      } else {
        // Update local messages state
        setMessages(prev => 
          prev.map(msg => 
            msg.sender_id === chatPartnerId && msg.receiver_id === userId && !msg.is_read
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };

  return { messages, optimisticMessages, isLoading, sendMessage, markMessagesAsRead };
};
