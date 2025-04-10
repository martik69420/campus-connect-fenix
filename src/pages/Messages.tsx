import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import ContactsList from '@/components/messaging/ContactsList';
import MessagesList from '@/components/messaging/MessagesList';
import ChatHeader from '@/components/messaging/ChatHeader';
import MessageInput from '@/components/messaging/MessageInput';
import { Loader2, UserX, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdBanner from '@/components/ads/AdBanner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import useMessages from '@/hooks/use-messages';

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

interface Friend {
  id: string;
  friendId: string;
  username: string;
  displayName: string;
  avatar: string | null;
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
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  
  const userIdFromParams = searchParams.get('userId');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
      fetchAllFriends();
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
          
          // Mark the message as read
          supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', newMsg.id);
            
          // Update unread count in contacts list
          setContacts(prev => 
            prev.map(contact => 
              contact.id === activeContact.id
                ? { ...contact, unreadCount: 0 }
                : contact
            )
          );
          
          // Scroll to bottom on new message
          scrollToBottom();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact, user]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const fetchAllFriends = async () => {
    if (!user?.id) return;
    
    setFriendsLoading(true);
    try {
      // First get all friend relationships where user is the requester
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
      
      // Also get reverse relationships where user is the recipient
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
      const friends = [
        ...(friendsData || []).map(item => ({
          id: item.id,
          friendId: item.friend_id,
          username: item.profiles.username,
          displayName: item.profiles.display_name,
          avatar: item.profiles.avatar_url
        })),
        ...(reverseData || []).map(item => ({
          id: item.id,
          friendId: item.user_id,
          username: item.profiles.username,
          displayName: item.profiles.display_name,
          avatar: item.profiles.avatar_url
        }))
      ];
      
      setAllFriends(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setFriendsLoading(false);
    }
  };
  
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
      
      // Filter contacts by search query and sort by most recent message
      const filteredContacts = contactsWithMessages
        .filter(contact => {
          if (!searchQuery) return true;
          
          return contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.username.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
          // Sort by unread messages first, then by latest message
          if (a.unreadCount && !b.unreadCount) return -1;
          if (!a.unreadCount && b.unreadCount) return 1;
          
          const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return dateB - dateA;
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
          
        // Update unread count in contacts list
        setContacts(prev => 
          prev.map(contact => 
            contact.id === contactId
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        );
      }
      
      // Scroll to bottom after messages load
      scrollToBottom();
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
      
      // Add the real message to the list
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
      
      // Scroll to bottom
      scrollToBottom();
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
  
  const startNewChat = (friend: Friend) => {
    // Check if contact already exists in the contacts list
    const existingContact = contacts.find(contact => contact.id === friend.friendId);
    
    // If it exists, just select it
    if (existingContact) {
      setActiveContact(existingContact);
      return;
    }
    
    // Otherwise create a new contact and add it to the list
    const newContact: Contact = {
      id: friend.friendId,
      username: friend.username,
      displayName: friend.displayName,
      avatar: friend.avatar
    };
    
    setContacts(prev => [...prev, newContact]);
    setActiveContact(newContact);
  };
  
  // Filter friends based on search
  const filteredFriends = allFriends.filter(friend => {
    if (!friendsSearchQuery) return true;
    
    return friend.displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase()) ||
           friend.username.toLowerCase().includes(friendsSearchQuery.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-4 px-0 md:px-4">
        {/* AdSense Ad at the top of Messages */}
        <AdBanner adSlot="5082313008" />
      
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-4">
          {/* Friends list panel */}
          <Card className="w-full md:w-80 md:max-w-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Users className="h-5 w-5 mr-2" />
                All Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search friends..."
                  className="pl-8"
                  value={friendsSearchQuery}
                  onChange={(e) => setFriendsSearchQuery(e.target.value)}
                />
              </div>
              
              <Separator className="mb-4" />
              
              <ScrollArea className="h-[400px] pr-4">
                {friendsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No friends found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => navigate('/add-friends')}
                    >
                      Find Friends
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredFriends.map(friend => (
                      <button
                        key={friend.id}
                        className="flex items-center space-x-3 p-2 hover:bg-secondary/10 rounded-md transition-colors text-left w-full"
                        onClick={() => startNewChat(friend)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.displayName} />
                          <AvatarFallback>
                            {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
      
          {/* Main Chat Panel */}
          <Card className="flex-1 flex flex-col h-[calc(100vh-250px)]">
            <Tabs defaultValue="chats" className="w-full">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="chats" className="flex-1">Active Chats</TabsTrigger>
                <TabsTrigger value="new" className="flex-1">New Message</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats" className="flex flex-col flex-1 overflow-hidden mt-0">
                <div className="flex flex-col md:flex-row h-full">
                  {/* Left side: Contacts */}
                  <div className="flex-none w-full md:w-80 md:border-r flex flex-col overflow-hidden max-h-[300px] md:max-h-none">
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
                        <div className="flex-1 overflow-y-auto" id="messages-container">
                          <MessagesList
                            messages={messages}
                            optimisticMessages={optimisticMessages}
                            currentUserId={user?.id || ''}
                            isLoading={messagesLoading}
                          />
                          <div ref={messagesEndRef} />
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
                </div>
              </TabsContent>
              
              <TabsContent value="new" className="p-4 h-full">
                <Card className="border-2 h-full">
                  <CardHeader>
                    <CardTitle>Start a New Conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search friends..."
                        className="pl-8"
                        value={friendsSearchQuery}
                        onChange={(e) => setFriendsSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Select a friend:</h3>
                      <ScrollArea className="h-[400px] pr-4">
                        {friendsLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : filteredFriends.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No friends found</p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => navigate('/add-friends')}
                            >
                              Find Friends
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                            {filteredFriends.map(friend => (
                              <button
                                key={friend.id}
                                className="flex items-center space-x-3 p-3 hover:bg-secondary/10 rounded-md transition-colors text-left w-full border border-muted"
                                onClick={() => startNewChat(friend)}
                              >
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.displayName} />
                                  <AvatarFallback>
                                    {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{friend.displayName}</p>
                                  <p className="text-sm text-muted-foreground">@{friend.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* AdSense Ad at the bottom of Messages */}
        <AdBanner adSlot="2813542194" className="mt-4" />
      </div>
    </AppLayout>
  );
};

export default Messages;
