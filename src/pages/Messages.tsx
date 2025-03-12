
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Send, Plus, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
};

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
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
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
  
  const fetchConversations = async () => {
    if (!user) return;
    
    setLoadingConversations(true);
    
    try {
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
        .eq('status', 'accepted');
        
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        setConversations(getMockConversations());
        return;
      }
      
      if (friendsData && friendsData.length > 0) {
        const conversationsFromFriends: Conversation[] = friendsData.map(friendship => {
          // Determine which profile is the friend (not the current user)
          const friendProfile = friendship.user_id === user.id 
            ? friendship.friend_profile
            : friendship.user_profile;
            
          return {
            id: friendship.id,
            userId: friendProfile.id,
            username: friendProfile.username,
            displayName: friendProfile.display_name,
            avatar: friendProfile.avatar_url || '/placeholder.svg',
            lastMessage: "No messages yet",
            lastMessageTime: new Date(),
            unread: 0
          };
        });
        
        setConversations(conversationsFromFriends);
        
        if (conversationsFromFriends.length > 0 && !activeConversation) {
          setActiveConversation(conversationsFromFriends[0].id);
          fetchMessages(conversationsFromFriends[0].id, conversationsFromFriends[0].userId);
        }
      } else {
        const mockConversations = getMockConversations();
        setConversations(mockConversations);
        
        if (mockConversations.length > 0 && !activeConversation) {
          setActiveConversation(mockConversations[0].id);
          setMessages(SAMPLE_MESSAGES[mockConversations[0].id] || []);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations(getMockConversations());
    } finally {
      setLoadingConversations(false);
    }
  };
  
  const fetchMessages = async (conversationId: string, friendId: string) => {
    if (!user) return;
    
    setLoadingMessages(true);
    setActiveConversation(conversationId);
    
    // For now, use mock messages
    // In a real app, fetch from database
    setMessages(SAMPLE_MESSAGES[conversationId] || []);
    setLoadingMessages(false);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !user) return;
    
    // Create new message
    const message: Message = {
      id: `m${Date.now()}`,
      senderId: user.id,
      content: newMessage,
      timestamp: new Date()
    };
    
    // Add message to the conversation
    setMessages(prev => [...prev, message]);
    
    // Update last message in conversation list
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { 
            ...conv, 
            lastMessage: newMessage, 
            lastMessageTime: new Date() 
          }
        : conv
    ));
    
    // Reset input
    setNewMessage('');
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
  
  // Create a new conversation
  const handleNewConversation = () => {
    navigate('/friends'); // Redirect to friends page to select someone
  };
  
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <div className="grid md:grid-cols-[300px_1fr] h-full">
          {/* Conversations sidebar */}
          <div className="border-r">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <Button variant="outline" size="icon" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
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
                      onClick={() => fetchMessages(conv.id, conv.userId)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conv.avatar} alt={conv.displayName} />
                          <AvatarFallback>
                            {conv.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
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
                            {typeof conv.lastMessageTime.toLocaleTimeString === 'function' 
                              ? conv.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
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
                  <h3 className="font-medium mb-1">No conversations found</h3>
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
                  <Avatar>
                    <AvatarImage 
                      src={getCurrentConversation()?.avatar || '/placeholder.svg'} 
                      alt={getCurrentConversation()?.displayName || 'User'} 
                    />
                    <AvatarFallback>
                      {getCurrentConversation()?.displayName.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
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
                        const isOwnMessage = message.senderId === user?.id;
                        
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
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
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
                <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Connect with your friends and classmates through private messages
                </p>
                <Button onClick={handleNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Sample conversations (fallback)
const getMockConversations = (): Conversation[] => [
  {
    id: 'conv1',
    userId: '2',
    username: 'jane_smith',
    displayName: 'Jane Smith',
    avatar: '/placeholder.svg',
    lastMessage: 'Hey, how are you doing?',
    lastMessageTime: new Date(Date.now() - 3600000 * 2),
    unread: 2
  },
  {
    id: 'conv2',
    userId: '3',
    username: 'alex_johnson',
    displayName: 'Alex Johnson',
    avatar: '/placeholder.svg',
    lastMessage: 'Did you finish the assignment?',
    lastMessageTime: new Date(Date.now() - 3600000 * 24),
    unread: 0
  }
];

// Sample messages for a conversation (fallback)
const SAMPLE_MESSAGES: Record<string, Message[]> = {
  'conv1': [
    {
      id: 'm1',
      senderId: '2',
      content: 'Hey there!',
      timestamp: new Date(Date.now() - 3600000 * 3)
    },
    {
      id: 'm2',
      senderId: '1',
      content: 'Hi! How are you?',
      timestamp: new Date(Date.now() - 3600000 * 2.5)
    },
    {
      id: 'm3',
      senderId: '2',
      content: 'I\'m good, thanks! Just wondering if you\'re going to the study group tomorrow?',
      timestamp: new Date(Date.now() - 3600000 * 2.3)
    },
    {
      id: 'm4',
      senderId: '2',
      content: 'Hey, how are you doing?',
      timestamp: new Date(Date.now() - 3600000 * 2)
    }
  ],
  'conv2': [
    {
      id: 'm5',
      senderId: '3',
      content: 'Hi, have you started on the project yet?',
      timestamp: new Date(Date.now() - 3600000 * 25)
    },
    {
      id: 'm6',
      senderId: '1',
      content: 'Yes, I\'ve completed the first part. How about you?',
      timestamp: new Date(Date.now() - 3600000 * 24.5)
    },
    {
      id: 'm7',
      senderId: '3',
      content: 'Did you finish the assignment?',
      timestamp: new Date(Date.now() - 3600000 * 24)
    }
  ]
};

export default Messages;
