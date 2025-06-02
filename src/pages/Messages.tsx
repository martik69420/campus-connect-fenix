
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import ContactsList from '@/components/messaging/ContactsList';
import MessagesList from '@/components/messaging/MessagesList';
import ChatHeader from '@/components/messaging/ChatHeader';
import MessageInput from '@/components/messaging/MessageInput';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdBanner from '@/components/ads/AdBanner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userIdFromParams = searchParams.get('userId');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);
  
  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Fetch friends and create contacts list
  const fetchContacts = async () => {
    if (!user?.id) return;
    
    setContactsLoading(true);
    console.log('Fetching contacts for user:', user.id);
    
    try {
      // Get friends where user is the requester
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles!friend_id(id, username, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'friends');
      
      if (friendsError) throw friendsError;
      
      // Get friends where user is the recipient
      const { data: reverseData, error: reverseError } = await supabase
        .from('friends')
        .select(`
          user_id,
          profiles!user_id(id, username, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'friends');
      
      if (reverseError) throw reverseError;
      
      // Combine both friend relationships
      const allFriends = [
        ...(friendsData || []).map(item => ({
          id: item.friend_id,
          username: item.profiles?.username || '',
          displayName: item.profiles?.display_name || '',
          avatar: item.profiles?.avatar_url
        })),
        ...(reverseData || []).map(item => ({
          id: item.user_id,
          username: item.profiles?.username || '',
          displayName: item.profiles?.display_name || '',
          avatar: item.profiles?.avatar_url
        }))
      ];
      
      console.log('Found friends:', allFriends);
      
      // Get last message and unread count for each friend
      const contactsWithMessages = await Promise.all(
        allFriends.map(async (friend) => {
          // Get last message between user and friend
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
          
          // Get unread count (messages from friend to user that are unread)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friend.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          
          const lastMessage = lastMessageData?.[0];
          
          return {
            ...friend,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            unreadCount: unreadCount || 0
          };
        })
      );
      
      // Sort by most recent message
      const sortedContacts = contactsWithMessages.sort((a, b) => {
        const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return dateB - dateA;
      });
      
      setContacts(sortedContacts);
      console.log('Contacts loaded:', sortedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Failed to load contacts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setContactsLoading(false);
    }
  };
  
  // Fetch messages for active contact
  const fetchMessages = async (contactId: string) => {
    if (!user?.id) return;
    
    setMessagesLoading(true);
    console.log('Fetching messages between:', user.id, 'and:', contactId);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      console.log('Messages loaded:', data?.length || 0);
      
      // Mark unread messages as read
      const unreadMsgIds = (data || [])
        .filter(msg => msg.sender_id === contactId && msg.receiver_id === user.id && !msg.is_read)
        .map(msg => msg.id);
      
      if (unreadMsgIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMsgIds);
        
        // Update contact's unread count
        setContacts(prev => 
          prev.map(contact => 
            contact.id === contactId
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        );
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMessagesLoading(false);
    }
  };
  
  // Set up real-time subscription for new messages
  const setupRealtimeSubscription = () => {
    if (!user?.id || !activeContact?.id) return;
    
    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
    
    console.log('Setting up realtime subscription for:', activeContact.id);
    
    const channel = supabase
      .channel(`messages-${user.id}-${activeContact.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('New message received:', payload);
        const newMessage = payload.new as Message;
        
        // Only add if it's between current user and active contact
        if ((newMessage.sender_id === user.id && newMessage.receiver_id === activeContact.id) ||
            (newMessage.sender_id === activeContact.id && newMessage.receiver_id === user.id)) {
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // If message is from the active contact to user, mark as read
          if (newMessage.sender_id === activeContact.id && newMessage.receiver_id === user.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      })
      .subscribe();
    
    realtimeChannelRef.current = channel;
  };
  
  // Send message
  const handleSendMessage = async (content: string) => {
    if (!user?.id || !activeContact || !content.trim()) return;
    
    setMessageSending(true);
    
    // Create optimistic message
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user.id,
      receiver_id: activeContact.id,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content,
          sender_id: user.id,
          receiver_id: activeContact.id,
        }])
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Remove optimistic message and add real one
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMsg.id));
      setMessages(prev => [...prev, data]);
      
      // Update contact's last message
      setContacts(prev => 
        prev.map(contact => 
          contact.id === activeContact.id
            ? {
                ...contact,
                lastMessage: content,
                lastMessageTime: data.created_at
              }
            : contact
        )
      );
      
      console.log('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMsg.id));
      
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMessageSending(false);
    }
  };
  
  // Load contacts when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchContacts();
    }
  }, [isAuthenticated, user]);
  
  // Set active contact from URL or first contact
  useEffect(() => {
    if (userIdFromParams && contacts.length > 0) {
      const contact = contacts.find(c => c.id === userIdFromParams);
      if (contact) {
        setActiveContact(contact);
      }
    } else if (contacts.length > 0 && !activeContact) {
      // Don't auto-select first contact, let user choose
    }
  }, [userIdFromParams, contacts]);
  
  // Load messages and setup realtime when active contact changes
  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
      setupRealtimeSubscription();
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [activeContact, user]);
  
  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const handleOpenNewChat = () => {
    navigate('/add-friends');
  };
  
  const handleOpenUserActions = () => {
    console.log('Open user actions for:', activeContact?.username);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    
    return contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contact.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-4 px-0 md:px-4">
        <AdBanner adSlot="5082313008" />
      
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-4">
          <Card className="flex-1 flex flex-col h-[calc(100vh-250px)] bg-card">
            <div className="flex flex-col md:flex-row h-full">
              {/* Left side: Contacts */}
              <div className="flex-none w-full md:w-80 md:border-r flex flex-col overflow-hidden max-h-[300px] md:max-h-none">
                <ContactsList
                  contacts={filteredContacts}
                  activeContactId={activeContact?.id || ''}
                  setActiveContact={setActiveContact}
                  isLoading={contactsLoading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onNewChat={handleOpenNewChat}
                />
              </div>
              
              {/* Right side: Messages */}
              <div className="flex-1 flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {activeContact ? (
                  <>
                    <ChatHeader 
                      contact={activeContact} 
                      onOpenUserActions={handleOpenUserActions} 
                    />
                    <div className="flex-1 overflow-y-auto" id="messages-container">
                      <MessagesList
                        messages={messages}
                        optimisticMessages={optimisticMessages}
                        currentUserId={user?.id || ''}
                        isLoading={messagesLoading}
                      />
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <MessageInput 
                        onSendMessage={handleSendMessage} 
                        isSending={messageSending}
                        disabled={!activeContact}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No conversation selected</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a contact to start messaging
                    </p>
                    <Button onClick={handleOpenNewChat}>
                      Find Friends
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        <AdBanner adSlot="2813542194" className="mt-4" />
      </div>
    </AppLayout>
  );
};

export default Messages;
