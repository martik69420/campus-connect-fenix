import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Send, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friendProfile, setFriendProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userIdFromParams = searchParams.get('userId');
  const [friendId, setFriendId] = useState(userIdFromParams || '');
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    if (user) {
      if (userIdFromParams) {
        setFriendId(userIdFromParams);
      }
      fetchMessages();
    }
  }, [user, isAuthenticated, isLoading, navigate, userIdFromParams]);
  
  useEffect(() => {
    if (friendId) {
      fetchFriendProfile();
    }
  }, [friendId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const fetchMessages = async () => {
    if (!user || !friendId) {
      console.log("Cannot fetch messages: User is not authenticated or friendId is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch messages between the current user and the selected friend
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }
      
      // Fetch all relevant user profiles for the messages
      const senderIds = new Set<string>();
      messagesData?.forEach((msg: any) => {
        senderIds.add(msg.sender_id);
      });
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', Array.from(senderIds));
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      // Map profiles to a dictionary
      const profilesMap: Record<string, any> = {};
      profilesData?.forEach((profile: any) => {
        profilesMap[profile.id] = profile;
      });
      
      // Filter messages to only include those between the current user and the selected friend
      const filteredMessages = messagesData?.filter(
        (msg: any) =>
          (msg.sender_id === user.id && msg.receiver_id === friendId) ||
          (msg.sender_id === friendId && msg.receiver_id === user.id)
      ).map((msg: any) => ({
        ...msg,
        sender_profile: profilesMap[msg.sender_id]
      }));
      
      setMessages(filteredMessages || []);
      
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFriendProfile = async () => {
    if (!friendId) return;
    
    try {
      const { data: friendData, error: friendError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single();
        
      if (friendError) {
        console.error("Error fetching friend profile:", friendError);
        throw friendError;
      }
      
      setFriendProfile(friendData || null);
      
    } catch (error: any) {
      console.error('Error fetching friend profile:', error);
      toast({
        title: "Failed to load friend profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleSendMessage = async () => {
    if (!user || !friendId) {
      toast({
        title: "Error",
        description: "Could not send message. Please ensure you are logged in and have a recipient selected.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    
    try {
      // Create a temporary optimistic message for UI feedback
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender_id: user.id,
        receiver_id: friendId,
        created_at: new Date().toISOString(),
        sender_profile: {
          username: user.username,
          display_name: user.displayName,
          avatar_url: user.avatar || ''
        }
      };
      
      // Update UI optimistically
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Send the new message
      const { data: newMessageData, error: newMessageError } = await supabase
        .from('messages')
        .insert([
          {
            content: newMessage,
            sender_id: user.id,
            receiver_id: friendId,
          },
        ]);
        
      if (newMessageError) {
        console.error("Error sending message:", newMessageError);
        
        // Remove optimistic message on error
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== optimisticMessage.id)
        );
        
        throw newMessageError;
      }
      
      // Clear the input field
      setNewMessage('');
      
      // Scroll to bottom after sending
      scrollToBottom();
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {friendProfile ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  ←
                </Button>
                <Avatar>
                  <AvatarImage src={friendProfile.avatar_url || "/placeholder.svg"} alt={friendProfile.display_name} />
                  <AvatarFallback>{friendProfile.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{friendProfile.display_name}</h2>
                  <p className="text-sm text-muted-foreground">@{friendProfile.username}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`flex flex-col ${message.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className={cn(
                        "px-4 py-2 rounded-xl shadow-sm max-w-[75%] break-words",
                        message.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}>
                        {message.content}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <User className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No messages yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Start the conversation!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Send
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-10">
            <User className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Select a friend to start messaging</h3>
            <p className="text-muted-foreground mt-1">
              Go to the Friends page to connect with people
            </p>
            <Button onClick={() => navigate('/friends')}>Go to Friends</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
