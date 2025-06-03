
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ContactsList from '@/components/messaging/ContactsList';
import ChatHeader from '@/components/messaging/ChatHeader';
import MessagesList from '@/components/messaging/MessagesList';
import MessageInput from '@/components/messaging/MessageInput';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import useMessages from '@/hooks/use-messages';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const {
    friends,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends
  } = useMessages();

  // Check for userId in URL params
  useEffect(() => {
    const userIdFromParams = searchParams.get('userId') || searchParams.get('user');
    if (userIdFromParams) {
      setSelectedUserId(userIdFromParams);
    }
  }, [searchParams]);

  // Fetch friends on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated, fetching friends...');
      fetchFriends();
    }
  }, [user?.id, fetchFriends]);

  // Fetch messages when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && user?.id) {
      fetchMessages(selectedUserId);
      
      // Find the selected user from friends list
      const friend = friends.find(f => f.id === selectedUserId);
      setSelectedUser(friend);
    }
  }, [selectedUserId, user?.id, fetchMessages, friends]);

  const handleSelectUser = (userId: string) => {
    console.log('Selecting user:', userId);
    setSelectedUserId(userId);
    const friend = friends.find(f => f.id === userId);
    setSelectedUser(friend);
  };

  const handleSendMessage = async (content: string) => {
    if (selectedUserId) {
      setIsSending(true);
      try {
        await sendMessage(selectedUserId, content);
      } finally {
        setIsSending(false);
      }
    }
  };

  const setActiveContact = (contact: any) => {
    console.log('Setting active contact:', contact);
    setSelectedUserId(contact.id);
    setSelectedUser(contact);
  };

  const handleNewChat = () => {
    // Handle new chat functionality
    console.log('New chat clicked');
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('messages.title')}</h1>
          <p className="text-muted-foreground">{t('messages.chatWithFriends')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Contacts List */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <ContactsList
                contacts={friends}
                activeContactId={selectedUserId || ''}
                setActiveContact={setActiveContact}
                isLoading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewChat={handleNewChat}
              />
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8">
            <Card className="h-full flex flex-col">
              {selectedUser ? (
                <>
                  <ChatHeader 
                    contact={selectedUser} 
                    onOpenUserActions={() => console.log('Open user actions')}
                  />
                  <div className="flex-1 min-h-0">
                    <MessagesList
                      messages={messages}
                      optimisticMessages={[]}
                      currentUserId={user?.id || ''}
                      isLoading={loading}
                    />
                  </div>
                  <MessageInput 
                    onSendMessage={handleSendMessage}
                    isSending={isSending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t('messages.noConversation')}</h3>
                    <p className="text-muted-foreground mt-1">
                      {t('messages.selectContact')}
                    </p>
                    {friends.length === 0 && !loading && (
                      <p className="text-sm text-muted-foreground mt-2">
                        You don't have any friends yet. Add some friends to start messaging!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
