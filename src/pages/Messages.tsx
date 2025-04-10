
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
import { Loader2, UserX } from 'lucide-react';
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

interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
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
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userIdFromParams = searchParams.get('userId');
  
  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Load contacts when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchContacts();
    }
  }, [isAuthenticated, user]);
  
  // Set active contact from URL parameter or first contact
  useEffect(() => {
    if (userIdFromParams && contacts.length > 0) {
      const contact = contacts.find(c => c.id === userIdFromParams);
      if (contact) {
        setActiveContact(contact);
      }
    } else if (contacts.length > 0 && !activeContact) {
      setActiveContact(contacts[0]);
    }
  }, [userIdFromParams, contacts, activeContact]);
  
  // Load messages when active contact changes
  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);
  
  // Set up realtime subscription for messages
  useEffect(() => {
    if (!user?.id || !activeContact?.id) return;
    
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${activeContact.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.receiver_id === user.id) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact, user]);
  
  const fetchContacts = async () => {
    if (!user?.id) return;
    
    setContactsLoading(true);
    
    try {
      // First get all friend relationships
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          friend_id,
          profiles!friend_id(id, username, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'friends');
      
      if (friendsError) throw friendsError;
      
      // Also get reverse relationships
      const { data: reverseData, error: reverseError } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          user_id,
          profiles!user_id(id, username, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'friends');
      
      if (reverseError) throw reverseError;
      
      // Process friends data with correct relationship names
      const allFriends = [
        ...(friendsData || []).map(item => ({
          friendId: item.friend_id,
          profile: item.profiles as FriendProfile
        })),
        ...(reverseData || []).map(item => ({
          friendId: item.user_id,
          profile: item.profiles as FriendProfile
        }))
      ];
      
      // Now get last message and unread count for each friend
      const contactsWithMessages = await Promise.all(
        allFriends.map(async (friend) => {
          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .or(`sender_id.eq.${friend.friendId},receiver_id.eq.${friend.friendId}`)
            .order('created_at', { ascending: false })
            .limit(1);
          
          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friend.friendId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          
          const lastMessage = lastMessageData && lastMessageData[0];
          
          return {
            id: friend.friendId,
            username: friend.profile.username,
            displayName: friend.profile.display_name,
            avatar: friend.profile.avatar_url,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            unreadCount: unreadCount || 0
          };
        })
      );
      
      // Filter contacts by search query
      const filteredContacts = contactsWithMessages.filter(contact => {
        if (!searchQuery) return true;
        
        return contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               contact.username.toLowerCase().includes(searchQuery.toLowerCase());
      });
      
      setContacts(filteredContacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Failed to load contacts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setContactsLoading(false);
      setLoading(false);
    }
  };
  
  const fetchMessages = async (contactId: string) => {
    if (!user?.id) return;
    
    setMessagesLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},sender_id.eq.${contactId}`)
        .or(`receiver_id.eq.${user.id},receiver_id.eq.${contactId}`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Filter messages to only include those between the current user and selected contact
      const filteredMessages = data?.filter(
        (msg) =>
          (msg.sender_id === user.id && msg.receiver_id === contactId) ||
          (msg.sender_id === contactId && msg.receiver_id === user.id)
      ) || [];
      
      setMessages(filteredMessages);
      
      // Mark received messages as read
      const unreadMsgIds = filteredMessages
        .filter(msg => msg.sender_id === contactId && !msg.is_read)
        .map(msg => msg.id);
      
      if (unreadMsgIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMsgIds);
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
  
  const handleSendMessage = async (content: string) => {
    if (!user?.id || !activeContact || !content.trim()) return;
    
    setMessageSending(true);
    
    // Create a temporary optimistic message
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user.id,
      receiver_id: activeContact.id,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    // Add to optimistic messages
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    
    try {
      // Send the actual message
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            sender_id: user.id,
            receiver_id: activeContact.id,
          },
        ])
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Remove optimistic message when real one arrives
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMsg.id)
      );
      
      // Refresh messages to include the new one
      setMessages(prev => [...prev, data]);
      
      // Also update contacts to show latest message
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === activeContact.id
            ? {
                ...contact,
                lastMessage: content,
                lastMessageTime: new Date().toISOString()
              }
            : contact
        )
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the optimistic message on error
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMsg.id)
      );
      
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMessageSending(false);
    }
  };
  
  const handleOpenNewChat = () => {
    navigate('/add-friends');
  };
  
  const handleOpenUserActions = () => {
    console.log('Open user actions for:', activeContact?.username);
  };
  
  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-4 px-0 md:px-4">
        {/* AdSense Ad at the top of Messages */}
        <AdBanner adSlot="5082313008" />
      
        <Card className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
          {/* Left side: Contacts */}
          <div className="flex-none w-full md:w-80 md:border-r flex flex-col overflow-hidden">
            <ContactsList
              contacts={contacts}
              activeContactId={activeContact?.id || ''}
              setActiveContact={setActiveContact}
              isLoading={contactsLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onNewChat={handleOpenNewChat}
            />
          </div>
          
          {/* Right side: Messages */}
          <div className="flex-1 flex flex-col">
            {activeContact ? (
              <>
                <ChatHeader 
                  contact={activeContact} 
                  onOpenUserActions={handleOpenUserActions} 
                />
                <div className="flex-1 overflow-y-auto">
                  <MessagesList
                    messages={messages}
                    optimisticMessages={optimisticMessages}
                    currentUserId={user?.id || ''}
                    isLoading={messagesLoading}
                  />
                </div>
                <div className="p-3 border-t">
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
                  Select a friend from the list or add new friends
                </p>
                <Button onClick={handleOpenNewChat}>
                  Find Friends
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* AdSense Ad at the bottom of Messages */}
        <AdBanner adSlot="2813542194" />
      </div>
    </AppLayout>
  );
};

export default Messages;
