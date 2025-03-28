
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/use-messages';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import OnlineStatus from '@/components/OnlineStatus';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';
import {
  Send,
  User,
  Search,
  Loader2,
  MoreVertical,
  Trash,
  Flag,
  Bell,
  BellOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ReportModal from '@/components/ReportModal';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Store optimistic messages (ones we've sent but haven't been confirmed yet)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      
      try {
        setLoadingContacts(true);
        
        // Get all messages to and from the current user
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }
        
        // Extract unique contact IDs
        const contactIds = new Set<string>();
        
        messagesData?.forEach(message => {
          if (message.sender_id === user.id) {
            contactIds.add(message.receiver_id);
          } else {
            contactIds.add(message.sender_id);
          }
        });
        
        // Get contact profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', Array.from(contactIds));
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }
        
        // Create contacts with last message
        const contactsMap = new Map<string, Contact>();
        
        profiles?.forEach(profile => {
          contactsMap.set(profile.id, {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            avatar: profile.avatar_url,
            unreadCount: 0,
          });
        });
        
        // Process messages to get last message and unread count
        const processedContactIds = new Set<string>();
        
        messagesData?.forEach(message => {
          const contactId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          const contact = contactsMap.get(contactId);
          
          if (contact) {
            // Only set last message for first occurrence (most recent)
            if (!processedContactIds.has(contactId)) {
              contact.lastMessage = message.content;
              contact.lastMessageTime = message.created_at;
              processedContactIds.add(contactId);
            }
            
            // Count unread messages
            if (message.sender_id !== user.id && !message.is_read) {
              contact.unreadCount = (contact.unreadCount || 0) + 1;
            }
          }
        });
        
        const contactsList = Array.from(contactsMap.values());
        
        // Sort by last message time
        contactsList.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
        
        setContacts(contactsList);
        
        // If there's a contact, set the first one as active
        if (contactsList.length > 0 && !activeContactId) {
          setActiveContactId(contactsList[0].id);
          setActiveContact(contactsList[0]);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    
    fetchContacts();
    
    // Subscribe to new messages for real-time updates
    if (user) {
      const channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as Message;
            
            // Add the new message if it's from the active contact
            if (newMessage.sender_id === activeContactId) {
              setMessages(prev => [...prev, newMessage]);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              
              // Mark as read
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }
            
            // Update contacts list
            setContacts(prev => {
              const updated = [...prev];
              const contactIndex = updated.findIndex(c => c.id === newMessage.sender_id);
              
              if (contactIndex >= 0) {
                const contact = { ...updated[contactIndex] };
                contact.lastMessage = newMessage.content;
                contact.lastMessageTime = newMessage.created_at;
                
                // Only increment unread count if it's not the active contact
                if (newMessage.sender_id !== activeContactId) {
                  contact.unreadCount = (contact.unreadCount || 0) + 1;
                }
                
                // Move this contact to the top
                updated.splice(contactIndex, 1);
                updated.unshift(contact);
              } else {
                // It's a new contact, fetch their profile
                supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', newMessage.sender_id)
                  .single()
                  .then(({ data, error }) => {
                    if (error || !data) {
                      console.error('Error fetching new contact:', error);
                      return;
                    }
                    
                    const newContact: Contact = {
                      id: data.id,
                      username: data.username,
                      displayName: data.display_name,
                      avatar: data.avatar_url,
                      lastMessage: newMessage.content,
                      lastMessageTime: newMessage.created_at,
                      unreadCount: 1,
                    };
                    
                    setContacts(prev => [newContact, ...prev]);
                  });
              }
              
              return updated;
            });
            
            // Show a toast notification if it's not from the active contact
            if (newMessage.sender_id !== activeContactId) {
              // Find the sender
              const sender = contacts.find(c => c.id === newMessage.sender_id);
              
              if (sender) {
                toast({
                  title: t('messages.newMessage'),
                  description: `${sender.displayName || sender.username}: ${newMessage.content}`,
                  action: (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setActiveContactId(sender.id);
                        setActiveContact(sender);
                      }}
                    >
                      {t('messages.view')}
                    </Button>
                  ),
                });
              }
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeContactId]);
  
  // Fetch messages when active contact changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !activeContactId) return;
      
      try {
        setLoadingMessages(true);
        setMessages([]);
        
        // Get messages between current user and the active contact
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${activeContactId}),and(sender_id.eq.${activeContactId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }
        
        setMessages(data || []);
        
        // Mark unread messages as read
        const unreadMessages = data?.filter(
          message => message.sender_id === activeContactId && !message.is_read
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(message =>
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', message.id)
            )
          );
          
          // Update unread count in contacts
          setContacts(prev => {
            return prev.map(contact => {
              if (contact.id === activeContactId) {
                return { ...contact, unreadCount: 0 };
              }
              return contact;
            });
          });
        }
        
        // Find and set the active contact
        const activeContact = contacts.find(contact => contact.id === activeContactId) || null;
        setActiveContact(activeContact);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoadingMessages(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    fetchMessages();
  }, [user, activeContactId, contacts]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, optimisticMessages]);
  
  const handleSendMessage = async () => {
    if (!user || !activeContactId || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Create an optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        content: newMessage,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        receiver_id: activeContactId,
        is_read: false,
      };
      
      // Add to optimistic messages
      setOptimisticMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input
      setNewMessage('');
      
      // Actually send the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          receiver_id: activeContactId,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: t('common.error'),
          description: t('messages.sendError'),
          variant: "destructive",
        });
        return;
      }
      
      // Remove the optimistic message and add the real one
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      // Add to messages
      setMessages(prev => [...prev, data]);
      
      // Update the contact's last message
      setContacts(prev => {
        const updated = [...prev];
        const contactIndex = updated.findIndex(c => c.id === activeContactId);
        
        if (contactIndex >= 0) {
          const contact = { ...updated[contactIndex] };
          contact.lastMessage = newMessage;
          contact.lastMessageTime = new Date().toISOString();
          
          // Move this contact to the top
          updated.splice(contactIndex, 1);
          updated.unshift(contact);
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: t('common.error'),
        description: t('messages.sendError'),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Filter contacts based on search
  const filteredContacts = searchQuery
    ? contacts.filter(
        contact =>
          contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts;
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Contacts List */}
          <div className="md:col-span-1 border rounded-lg overflow-hidden shadow-sm h-full flex flex-col">
            <div className="border-b p-4">
              <h2 className="text-xl font-bold">{t('messages.conversations')}</h2>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('messages.searchContacts')}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                  <User className="h-12 w-12 mb-2" />
                  <p>{t('messages.noConversations')}</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={cn(
                      'flex items-center gap-3 p-3 hover:bg-muted w-full text-left border-b relative',
                      contact.id === activeContactId && 'bg-muted'
                    )}
                    onClick={() => {
                      setActiveContactId(contact.id);
                      setActiveContact(contact);
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.displayName || contact.username} />
                        <AvatarFallback>{contact.displayName?.charAt(0) || contact.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <OnlineStatus userId={contact.id} className="absolute -bottom-1 -right-1" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">
                          {contact.displayName || contact.username}
                        </h3>
                        {contact.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(contact.lastMessageTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.lastMessage || t('messages.noMessages')}
                      </p>
                    </div>
                    
                    {(contact.unreadCount || 0) > 0 && (
                      <span className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full h-5 min-w-5 flex items-center justify-center text-xs font-semibold px-1.5">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Messages View */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden shadow-sm h-full flex flex-col">
            {activeContact ? (
              <>
                <div className="border-b p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={activeContact.avatar || "/placeholder.svg"} alt={activeContact.displayName || activeContact.username} />
                      <AvatarFallback>
                        {activeContact.displayName?.charAt(0) || activeContact.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {activeContact.displayName || activeContact.username}
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <OnlineStatus userId={activeContact.id} showLabel />
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/profile/${activeContact.username}`)}>
                        <User className="h-4 w-4 mr-2" />
                        {t('messages.viewProfile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bell className="h-4 w-4 mr-2" />
                        {t('messages.muteNotifications')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-destructive">
                        <Flag className="h-4 w-4 mr-2" />
                        {t('messages.reportUser')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex',
                          index % 2 === 0 ? 'justify-start' : 'justify-end'
                        )}
                      >
                        <div className={cn(
                          'max-w-[80%] p-3 rounded-lg',
                          index % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'
                        )}>
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                    ))
                  ) : messages.length === 0 && optimisticMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <p>{t('messages.noMessagesYet')}</p>
                      <p className="text-sm">{t('messages.startConversation')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Real messages */}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            'flex',
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] p-3 rounded-lg',
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <div className="text-xs mt-1 opacity-70 text-right">
                              {new Date(message.created_at).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Optimistic messages */}
                      {optimisticMessages.map((message) => (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[80%] p-3 rounded-lg bg-primary text-primary-foreground opacity-80">
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <div className="text-xs mt-1 opacity-70 text-right flex justify-end items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              {t('messages.sending')}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={t('messages.typeMessage')}
                      className="min-h-10 flex-1 resize-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sendingMessage}
                    />
                    <Button
                      size="icon"
                      disabled={!newMessage.trim() || sendingMessage}
                      onClick={handleSendMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                <div className="mb-4 p-4 rounded-full bg-muted">
                  <Send className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('messages.selectContact')}</h3>
                <p className="max-w-md">{t('messages.selectContactDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && activeContact && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="user"
          targetId={activeContact.id}
          targetName={activeContact.displayName || activeContact.username}
        />
      )}
    </AppLayout>
  );
};

export default Messages;
