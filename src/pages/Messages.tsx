
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import ContactsList from '@/components/messaging/ContactsList';
import MessagesList from '@/components/messaging/MessagesList';
import ChatHeader from '@/components/messaging/ChatHeader';
import EnhancedMessageInput from '@/components/messaging/EnhancedMessageInput';
import { UserX, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdBanner from '@/components/ads/AdBanner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  isOnline?: boolean;
}

interface Friend {
  id: string;
  friendId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  isOnline?: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
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
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  
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

  // Set up realtime subscription for online status
  useEffect(() => {
    if (!user?.id) return;
    
    // Setup presence channel
    const presenceChannel = supabase.channel('online-users');
    
    // Subscribe to presence changes
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        updateContactsOnlineStatus(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // A user came online
        updateUserOnlineStatus(key, true);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // A user went offline
        updateUserOnlineStatus(key, false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });
      
    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, contacts]);
  
  const updateUserOnlineStatus = (userId: string, isOnline: boolean) => {
    // Update contacts if the user is in the contacts list
    setContacts(prev => 
      prev.map(contact => 
        contact.id === userId
          ? { ...contact, isOnline }
          : contact
      )
    );
    
    // Also update all friends
    setAllFriends(prev => 
      prev.map(friend => 
        friend.friendId === userId
          ? { ...friend, isOnline }
          : friend
      )
    );
  };
  
  const updateContactsOnlineStatus = (presenceState: Record<string, any[]>) => {
    // Get all online user IDs from presence state
    const onlineUserIds = new Set(Object.keys(presenceState));
    
    // Update contacts online status
    setContacts(prev => 
      prev.map(contact => ({
        ...contact,
        isOnline: onlineUserIds.has(contact.id)
      }))
    );
    
    // Update all friends online status
    setAllFriends(prev => 
      prev.map(friend => ({
        ...friend,
        isOnline: onlineUserIds.has(friend.friendId)
      }))
    );
  };
  
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
          avatar: item.profiles.avatar_url,
          isOnline: false // Default to offline until we get presence data
        })),
        ...(reverseData || []).map(item => ({
          id: item.id,
          friendId: item.user_id,
          username: item.profiles.username,
          displayName: item.profiles.display_name,
          avatar: item.profiles.avatar_url,
          isOnline: false // Default to offline until we get presence data
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
          profile: item.profiles
        })),
        ...(reverseData || []).map(item => ({
          friendId: item.user_id,
          profile: item.profiles
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
            unreadCount: unreadCount || 0,
            isOnline: false // Default to offline until we get presence data
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
  
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!user?.id || !activeContact || (!content.trim() && !attachments?.length)) return;
    
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
      // Handle file uploads if any
      let fileUrls: string[] = [];
      
      if (attachments && attachments.length > 0) {
        try {
          // Upload files to storage
          const uploadsPromises = attachments.map(async file => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { data, error } = await supabase.storage
              .from('message_attachments')
              .upload(filePath, file);
              
            if (error) throw error;
              
            // Get public URL for the file
            const { data: urlData } = supabase.storage
              .from('message_attachments')
              .getPublicUrl(filePath);
              
            return urlData.publicUrl;
          });
          
          fileUrls = await Promise.all(uploadsPromises);
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          toast({
            title: "Failed to upload files",
            description: "Your message was sent without attachments",
            variant: "destructive"
          });
        }
      }
      
      // Prepare message content with file URLs if any
      const messageContent = fileUrls.length > 0
        ? `${content}\n${fileUrls.join('\n')}`
        : content;
      
      // Send the actual message
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content: messageContent,
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
      avatar: friend.avatar,
      isOnline: friend.isOnline
    };
    
    setContacts(prev => [...prev, newContact]);
    setActiveContact(newContact);
  };

  const handleToggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const createGroupChat = () => {
    if (!groupName || selectedFriends.length < 2) {
      toast({
        title: "Cannot create group",
        description: "Please provide a group name and select at least 2 friends",
        variant: "destructive"
      });
      return;
    }
    
    // This would be implemented to create a group chat
    toast({
      title: "Group chat created",
      description: `Created group "${groupName}" with ${selectedFriends.length} members`,
    });
    setIsGroupChatModalOpen(false);
    setGroupName('');
    setSelectedFriends([]);
    
    // Add actual group chat creation logic here
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-4 px-0 md:px-4">
        <AdBanner adSlot="5082313008" />
      
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-4">
          <Card className="flex-1 flex flex-col h-[calc(100vh-220px)] bg-gradient-to-b from-background to-background/95 shadow-md border-opacity-40">
            <div className="flex flex-col md:flex-row h-full rounded-lg overflow-hidden">
              {/* Left side: Contacts with improved styling */}
              <div className="flex-none w-full md:w-80 md:border-r border-opacity-30 flex flex-col overflow-hidden max-h-[300px] md:max-h-none bg-card/80">
                <div className="p-3 border-b border-opacity-20 bg-muted/30 backdrop-blur-sm flex items-center justify-between">
                  <h3 className="font-medium text-base">{t('messages.conversations')}</h3>
                  <div className="flex space-x-1">
                    <Dialog open={isGroupChatModalOpen} onOpenChange={setIsGroupChatModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full" title={t('messages.createGroup')}>
                          <Users className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('messages.createGroup')}</DialogTitle>
                          <DialogDescription>
                            {t('messages.selectFriends')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label htmlFor="group-name">{t('messages.groupName')}</Label>
                            <Input 
                              id="group-name" 
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              placeholder="e.g. Study Group"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>{t('messages.selectFriends')}</Label>
                            <div className="mt-2">
                              <Input 
                                placeholder={t('messages.searchContacts')}
                                value={friendsSearchQuery}
                                onChange={(e) => setFriendsSearchQuery(e.target.value)}
                                className="mb-2"
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                              {allFriends
                                .filter(friend => 
                                  friend.displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase()) ||
                                  friend.username.toLowerCase().includes(friendsSearchQuery.toLowerCase())
                                )
                                .map(friend => (
                                  <div key={friend.id} className="flex items-center p-2 hover:bg-accent/50 rounded-md">
                                    <Checkbox 
                                      id={`friend-${friend.friendId}`} 
                                      checked={selectedFriends.includes(friend.friendId)}
                                      onCheckedChange={() => handleToggleFriendSelection(friend.friendId)}
                                      className="mr-3"
                                    />
                                    <div className="flex items-center space-x-3 flex-1" onClick={() => handleToggleFriendSelection(friend.friendId)}>
                                      <Avatar className="h-8 w-8 border">
                                        <AvatarImage src={friend.avatar || undefined} />
                                        <AvatarFallback>
                                          {friend.displayName ? friend.displayName[0].toUpperCase() : friend.username[0].toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm">{friend.displayName || friend.username}</span>
                                        <div className="flex items-center">
                                          <span className={`w-2 h-2 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'} mr-1.5`}></span>
                                          <span className="text-xs text-muted-foreground">{friend.isOnline ? t('profile.online') : t('profile.offline')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                              {allFriends.length === 0 && !friendsLoading && (
                                <div className="text-center p-4 text-muted-foreground">
                                  No friends found. Add some friends first.
                                </div>
                              )}
                              {friendsLoading && (
                                <div className="text-center p-4 text-muted-foreground">
                                  Loading friends...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsGroupChatModalOpen(false)}>
                            {t('post.cancel')}
                          </Button>
                          <Button 
                            onClick={createGroupChat}
                            disabled={!groupName || selectedFriends.length < 2}
                          >
                            {t('messages.createGroup')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleOpenNewChat} title={t('messages.addFriends')}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
              
              {/* Right side: Messages with updated styling */}
              <div className="flex-1 flex flex-col bg-card/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
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
                    <div className="p-3 border-t border-opacity-50 bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                      <EnhancedMessageInput 
                        onSendMessage={handleSendMessage} 
                        isSending={messageSending}
                        disabled={!activeContact}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <UserX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t('messages.noConversations')}</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                      {t('messages.startNewConversation')}
                    </p>
                    <div className="flex space-x-3">
                      <Button onClick={handleOpenNewChat} variant="default">
                        {t('messages.addFriends')}
                      </Button>
                      <Button onClick={() => setIsGroupChatModalOpen(true)} variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        {t('messages.createGroup')}
                      </Button>
                    </div>
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
