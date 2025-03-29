import React, { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
}

interface MessagesListProps {
  messages: Message[];
  optimisticMessages: Message[];
  currentUserId: string;
  isLoading: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  optimisticMessages,
  currentUserId,
  isLoading,
}) => {
  const { t } = useLanguage();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, optimisticMessages]);

  const formatMessageTime = (dateString: string) => {
    try {
      const messageDate = new Date(dateString);
      
      // If today, show only time
      if (messageDate.toDateString() === new Date().toDateString()) {
        return messageDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      
      // Otherwise show relative time
      return formatDistanceToNow(messageDate, { addSuffix: true });
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Combine real and optimistic messages, ensuring no duplicates
  const allMessages = [...messages];
  
  // Only add optimistic messages that don't have real counterparts
  optimisticMessages.forEach(optMsg => {
    if (!allMessages.some(msg => msg.id === optMsg.id)) {
      allMessages.push(optMsg);
    }
  });
  
  // Sort by creation date
  allMessages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (allMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="glass-panel p-6 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-muted-foreground"
          >
            <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
            <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-3">{t('messages.noMessagesYet')}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('messages.startConversation')}
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: (Message | { id: string; isDateDivider: true; date: string })[] } = {};
  
  // Helper to add a date divider
  const addDateDivider = (date: string, messageDate: Date) => {
    if (!groupedMessages[date]) {
      groupedMessages[date] = [
        {
          id: `date-${date}`,
          isDateDivider: true,
          date: messageDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
        },
      ];
    }
  };
  
  // Group all messages
  allMessages.forEach(message => {
    const messageDate = new Date(message.created_at);
    const dateKey = messageDate.toDateString();
    
    addDateDivider(dateKey, messageDate);
    groupedMessages[dateKey].push(message);
  });
  
  // Sort dates in ascending order
  const sortedDates = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="flex-1 p-3 overflow-y-auto chat-scrollbar bg-gradient-to-b from-background to-background/90">
      <div className="space-y-5">
        {sortedDates.map(date => (
          <div key={date} className="space-y-3">
            {groupedMessages[date].map(msg => {
              if ('isDateDivider' in msg) {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <div className="px-4 py-1.5 text-xs bg-primary/10 rounded-full text-primary font-medium">
                      {msg.date}
                    </div>
                  </div>
                );
              }
              
              const isCurrentUser = msg.sender_id === currentUserId;
              const isOptimistic = msg.id.startsWith('temp-');
              
              return (
                <motion.div
                  key={msg.id}
                  className={cn(
                    'flex',
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={cn(
                        'chat-bubble shadow-sm',
                        isCurrentUser
                          ? 'chat-bubble-sender'
                          : 'chat-bubble-receiver',
                        isOptimistic && 'opacity-70'
                      )}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={cn(
                        'message-time',
                        isCurrentUser ? 'text-right' : 'text-left'
                      )}
                    >
                      {isOptimistic ? (
                        <span className="flex items-center justify-end text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          {t('messages.sending')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default MessagesList;
