
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import ReportModal from '@/components/ReportModal';
import { useMessages } from '@/hooks/use-messages';  // Import the useMessages hook
import MessageInput from '@/components/messaging/MessageInput';
import MessagesList from '@/components/messaging/MessagesList';
import ChatHeader from '@/components/messaging/ChatHeader';
import ContactsList from '@/components/messaging/ContactsList';
import { Send, MessageSquare } from 'lucide-react';

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const location = window.location;
  
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Use the messages hook
  const { 
    messages, 
    optimisticMessages, 
    isLoading: loadingMessages, 
    sendMessage: sendMessageHook, 
    markMessagesAsRead 
  } = useMessages(activeContactId, user?.id || null);
  
  // Check for user ID in URL params and set active contact
  useEffect(() => {
    if (user && !activeContactId) {
      const urlParams = new URLSearchParams(location.search);
      const userIdFromUrl = urlParams.get('user');
      
      if (userIdFromUrl) {
        setActiveContactId(userIdFromUrl);
      }
    }
  }, [user, location, activeContactId]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);
  
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
        
        // Add the user ID from URL if it exists
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('user');
        if (userIdFromUrl && userIdFromUrl !== user.id) {
          contactIds.add(userIdFromUrl);
        }
        
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
        
        // If there's a contact and no active contact, set the first one as active, or if we have a user ID from URL
        if (contactsList.length > 0) {
          const urlParams = new URLSearchParams(location.search);
          const userIdFromUrl = urlParams.get('user');
          
          if (userIdFromUrl) {
            const contactFromUrl = contactsList.find(c => c.id === userIdFromUrl);
            if (contactFromUrl) {
              setActiveContactId(userIdFromUrl);
              setActiveContact(contactFromUrl);
            } else if (!activeContactId) {
              setActiveContactId(contactsList[0].id);
              setActiveContact(contactsList[0]);
            }
          } else if (!activeContactId) {
            setActiveContactId(contactsList[0].id);
            setActiveContact(contactsList[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    
    fetchContacts();
    
    // Subscribe to new messages for real-time updates to the contacts list
    if (user) {
      const channel = supabase
        .channel('new-messages-channel')
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
            const newMessage = payload.new as { id: string; sender_id: string; content: string; created_at: string };
            
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
                    <button 
                      className="bg-primary/10 hover:bg-primary/20 text-primary text-xs py-1 px-2 rounded"
                      onClick={() => {
                        setActiveContactId(sender.id);
                        setActiveContact(sender);
                        
                        // Update URL without reloading
                        const url = new URL(window.location.href);
                        url.searchParams.set('user', sender.id);
                        window.history.pushState({}, '', url);
                      }}
                    >
                      {t('messages.view')}
                    </button>
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
  }, [user, activeContactId, contacts, toast, t, location]);
  
  // Mark messages as read when active contact changes or when messages are loaded
  useEffect(() => {
    if (activeContactId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [activeContactId, messages, markMessagesAsRead]);
  
  // Update active contact when changing contacts
  useEffect(() => {
    if (activeContactId) {
      const contact = contacts.find(c => c.id === activeContactId);
      if (contact) {
        setActiveContact(contact);
      }
    }
  }, [activeContactId, contacts]);

  const handleSendMessage = async (content: string) => {
    if (!user || !activeContactId || !content.trim()) return;
    try {
      await sendMessageHook(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: t('common.error'),
        description: t('messages.sendError'),
        variant: "destructive",
      });
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
  
  const handleNewChat = () => {
    navigate('/add-friends');
  };
  
  if (authLoading) {
    return null;
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Contacts List */}
          <div className="md:col-span-1 border rounded-lg overflow-hidden shadow-sm h-full flex flex-col dark:border-gray-800">
            <ContactsList
              contacts={filteredContacts}
              activeContactId={activeContactId}
              setActiveContact={(contact) => {
                setActiveContactId(contact.id);
                setActiveContact(contact);
                // Update URL without reloading
                const url = new URL(window.location.href);
                url.searchParams.set('user', contact.id);
                window.history.pushState({}, '', url);
              }}
              isLoading={loadingContacts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onNewChat={handleNewChat}
            />
          </div>
          
          {/* Messages View */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden shadow-sm h-full flex flex-col dark:border-gray-800">
            {activeContact ? (
              <>
                <ChatHeader
                  contact={activeContact}
                  onOpenUserActions={() => setShowReportModal(true)}
                />
                
                <MessagesList
                  messages={messages}
                  optimisticMessages={optimisticMessages}
                  currentUserId={user?.id || ''}
                  isLoading={loadingMessages}
                />
                
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isSending={false}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="mb-4 p-6 rounded-full bg-muted/40">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t('messages.selectContact')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('messages.selectContactDescription')}
                </p>
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
