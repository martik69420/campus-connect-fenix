
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Send, Plus, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { useOnlineStatus } from '@/hooks/use-online-status';

type Conversation = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
};

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  // Get all user IDs from conversations to track online status
  const userIds = conversations.map(conv => conv.userId);
  
  // Use our custom hooks for messages and online status
  const { messages, isLoading: loadingMessages, sendMessage, markMessagesAsRead } = useMessages(activeUserId, user?.id || null);
  const { isUserOnline } = useOnlineStatus(userIds);

  // Parse URL params to get initial active user
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) {
      console.log('URL parameter userId found:', userId);
      setActiveUserId(userId);
      // We'll fetch this user's details regardless of whether they're in conversations
      fetchUserDetails(userId);
    }
  }, [location, user]);

  // Add function to fetch user details when directly accessing via URL
  const fetchUserDetails = async (userId: string) => {
    if (!user || !userId) return;
    
    try {
      console.log('Fetching user details for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user details:', error);
        return;
      }
      
      if (data) {
        console.log('User details fetched:', data);
        
        // Check if a conversation with this user already exists
        const existingConv = conversations.find(conv => conv.userId === userId);
        if (existingConv) {
          console.log('Conversation already exists:', existingConv);
          setActiveConversation(existingConv.id);
          return;
        }
        
        // Create a temporary conversation object
        const tempConversation = {
          id: `temp-${userId}`,
          userId: userId,
          username: data.username,
          displayName: data.display_name,
          avatar: data.avatar_url || '/placeholder.svg',
          lastMessage: "No messages yet",
          lastMessageTime: new Date(),
          unread: 0
        };
        
        // Add this to conversations
        setConversations(prev => {
          // Only add if it doesn't already exist
          if (!prev.some(conv => conv.userId === userId)) {
            return [tempConversation, ...prev];
          }
          return prev;
        });
        
        // Set as active
        setActiveConversation(`temp-${userId}`);
      }
    } catch (err) {
      console.error('Error in fetchUserDetails:', err);
    }
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Load conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (activeUserId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [activeUserId, messages, markMessagesAsRead]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    setLoadingConversations(true);
    
    try {
      console.log('Fetching conversations for user:', user.id);
      // Get all friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          friend_profile:profiles!friends_friend_id_fkey(id, username, display_name, avatar_url),
          user_profile:profiles!friends_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'friends');
        
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        throw friendsError;
      }
      
      console.log("Friends data fetched:", friendsData);
      
      if (friendsData && friendsData.length > 0) {
        // Create conversations from friends
        const conversationsPromises = friendsData.map(async (friendship) => {
          // Determine which profile is the friend (not the current user)
          const friendProfile = friendship.user_id === user.id 
            ? friendship.friend_profile
            : friendship.user_profile;
          
          // Get last message and unread count
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendProfile.id}),and(sender_id.eq.${friendProfile.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friendProfile.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
            
          return {
            id: friendship.id,
            userId: friendProfile.id,
            username: friendProfile.username,
            displayName: friendProfile.display_name,
            avatar: friendProfile.avatar_url || '/placeholder.svg',
            lastMessage: lastMessageData && lastMessageData.length > 0 
              ? lastMessageData[0].content 
              : "No messages yet",
            lastMessageTime: lastMessageData && lastMessageData.length > 0 
              ? new Date(lastMessageData[0].created_at) 
              : new Date(),
            unread: unreadCount || 0
          };
        });
        
        const conversationsFromFriends = await Promise.all(conversationsPromises);
        console.log("Conversations created from friends:", conversationsFromFriends);
        
        setConversations(conversationsFromFriends);
        
        // Process URL parameter if present
        const params = new URLSearchParams(location.search);
        const urlUserId = params.get('userId');
        
        if (urlUserId) {
          const conversation = conversationsFromFriends.find(conv => conv.userId === urlUserId);
          if (conversation) {
            console.log('Setting active conversation from URL parameter:', conversation.id);
            setActiveConversation(conversation.id);
          } else {
            // If not found in friends, fetch user details to create a temp conversation
            console.log('Friend not found in conversations, fetching details');
            fetchUserDetails(urlUserId);
          }
        } else if (conversationsFromFriends.length > 0 && !activeConversation) {
          // Set first conversation as active if none selected
          setActiveConversation(conversationsFromFriends[0].id);
          setActiveUserId(conversationsFromFriends[0].userId);
        }
      } else {
        console.log("No friends found, using sample conversations");
        // If no friends, use sample conversations
        const sampleConversations = getSampleConversations();
        setConversations(sampleConversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Fallback to sample conversations
      const sampleConversations = getSampleConversations();
      setConversations(sampleConversations);
    } finally {
      setLoadingConversations(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeUserId || !user) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
    
    // Refresh conversations to update last message
    fetchConversations();
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Get current conversation partner
  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === activeConversation);
  };
  
  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => 
    conv.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConversationClick = (conv: Conversation) => {
    setActiveConversation(conv.id);
    setActiveUserId(conv.userId);
    
    // Update URL to include userId parameter without navigation
    const params = new URLSearchParams(location.search);
    params.set('userId', conv.userId);
    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };
  
  // Create a new conversation
  const handleNewConversation = () => {
    navigate('/friends'); // Redirect to friends page to select someone
  };
  
  // Sample conversations (fallback)
  const getSampleConversations = (): Conversation[] => [
    {
      id: 'conv1',
      userId: '2',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      avatar: '/placeholder.svg',
      lastMessage: 'You have no friends yet. Add some friends to start messaging!',
      lastMessageTime: new Date(),
      unread: 0
    }
  ];
  
  // Render online status indicator for a user
  const renderOnlineStatus = (userId: string) => {
    const online = isUserOnline(userId);
    
    return (
      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
        online ? 'bg-green-500' : 'bg-gray-400'
      }`} title={online ? t('online') : t('offline')} />
    );
  };
  
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <div className="grid md:grid-cols-[300px_1fr] h-full">
          {/* Conversations sidebar */}
          <div className="border-r">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{t('messages')}</h2>
                <Button variant="outline" size="icon" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search_conversations')}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-10rem)]">
              {loadingConversations ? (
                <div className="space-y-1 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full flex items-center gap-3 p-2 rounded-lg">
                      <div className="animate-pulse w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="animate-pulse h-4 w-24 bg-muted rounded" />
                        <div className="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv) => (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        activeConversation === conv.id
                          ? 'bg-secondary'
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conv.avatar} alt={conv.displayName} />
                          <AvatarFallback>
                            {conv.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {renderOnlineStatus(conv.userId)}
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{conv.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {conv.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">{t('no_messages_yet')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? `No results for "${searchTerm}"`
                      : "Start chatting with your friends"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Chat area */}
          <div className="flex flex-col h-full">
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage 
                        src={getCurrentConversation()?.avatar || '/placeholder.svg'} 
                        alt={getCurrentConversation()?.displayName || 'User'} 
                      />
                      <AvatarFallback>
                        {getCurrentConversation()?.displayName.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {activeUserId && renderOnlineStatus(activeUserId)}
                  </div>
                  <div>
                    <h3 className="font-medium">{getCurrentConversation()?.displayName}</h3>
                    <p className="text-xs text-muted-foreground">@{getCurrentConversation()?.username}</p>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex gap-2 max-w-[70%]">
                            {i % 2 !== 0 && (
                              <div className="animate-pulse w-8 h-8 bg-muted rounded-full" />
                            )}
                            <div>
                              <div className={`animate-pulse rounded-lg p-3 h-12 w-40 ${
                                i % 2 === 0 ? 'bg-primary/20' : 'bg-muted'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex gap-2 max-w-[70%]">
                              {!isOwnMessage && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage 
                                    src={getCurrentConversation()?.avatar || '/placeholder.svg'} 
                                    alt={getCurrentConversation()?.displayName || 'User'} 
                                  />
                                  <AvatarFallback>
                                    {getCurrentConversation()?.displayName.substring(0, 2).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div 
                                  className={`rounded-lg p-3 ${
                                    isOwnMessage 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  {message.content}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(message.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <User className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-1">{t('no_messages_yet')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('send_first_message')}
                      </p>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('type_message')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('messages')}</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Connect with your friends and classmates through private messages
                </p>
                <Button onClick={handleNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('new_conversation')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
