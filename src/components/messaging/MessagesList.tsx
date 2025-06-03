
import React, { useRef, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  image_url?: string;
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Set a loading timeout to show fallback UI if loading takes too long
  useEffect(() => {
    if (isLoading && !showFallback) {
      const timeoutId = setTimeout(() => {
        setShowFallback(true);
      }, 5000);
      setLoadingTimeoutId(timeoutId);
    } else if (!isLoading && loadingTimeoutId) {
      clearTimeout(loadingTimeoutId);
      setLoadingTimeoutId(null);
      setShowFallback(false);
    }

    return () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
    };
  }, [isLoading, loadingTimeoutId, showFallback]);

  // Only scroll automatically on new messages if user is already at the bottom
  useEffect(() => {
    if (initialLoad && messages.length > 0) {
      setTimeout(() => {
        if (endOfMessagesRef.current) {
          endOfMessagesRef.current.scrollIntoView({ behavior: 'auto' });
        }
        setInitialLoad(false);
      }, 100);
      return;
    }

    if (shouldAutoScroll && isAtBottom && endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, optimisticMessages, shouldAutoScroll, isAtBottom, initialLoad]);

  // Enable auto-scroll when user sends a message (optimistic message added)
  useEffect(() => {
    if (optimisticMessages.length > 0) {
      setShouldAutoScroll(true);
      setIsAtBottom(true);
      
      setTimeout(() => {
        if (endOfMessagesRef.current) {
          endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }, [optimisticMessages]);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      setIsAtBottom(distanceFromBottom < 50);
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const messageDate = new Date(dateString);
      
      if (messageDate.toDateString() === new Date().toDateString()) {
        return messageDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      
      return formatDistanceToNow(messageDate, { addSuffix: true });
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  if (isLoading && (showFallback || messages.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="glass-panel p-8 rounded-xl text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-medium">Loading messages...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {showFallback ? "This is taking longer than expected. Please refresh if messages don't appear." : "Just a moment..."}
          </p>
        </div>
      </div>
    );
  }

  // Combine real and optimistic messages, ensuring no duplicates
  const allMessages = [...messages];
  
  optimisticMessages.forEach(optMsg => {
    if (!allMessages.some(msg => msg.id === optMsg.id)) {
      allMessages.push(optMsg);
    }
  });
  
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
        <h3 className="text-xl font-medium mb-3">No messages yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: (Message | { id: string; isDateDivider: true; date: string })[] } = {};
  
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
  
  allMessages.forEach(message => {
    const messageDate = new Date(message.created_at);
    const dateKey = messageDate.toDateString();
    
    addDateDivider(dateKey, messageDate);
    groupedMessages[dateKey].push(message);
  });
  
  const sortedDates = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-background/90">
      <ScrollArea 
        className="h-full px-3 py-4 chat-scrollbar"
        onScrollCapture={handleScroll}
        ref={scrollAreaRef}
      >
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
                        {/* Image message */}
                        {msg.image_url && (
                          <div className="mb-2">
                            <img 
                              src={msg.image_url} 
                              alt="Shared image" 
                              className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          </div>
                        )}
                        {/* Text content */}
                        {msg.content && (
                          <div>{msg.content}</div>
                        )}
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
                            Sending...
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
      </ScrollArea>
    </div>
  );
};

export default MessagesList;
