
import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  image_url?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
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
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const allMessages = [...messages, ...optimisticMessages];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const renderMessageStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    
    const status = message.status || 'sent';
    const iconClass = "h-3 w-3";
    
    switch (status) {
      case 'sending':
        return <Clock className={`${iconClass} text-muted-foreground`} />;
      case 'sent':
        return <Check className={`${iconClass} text-muted-foreground`} />;
      case 'delivered':
        return <CheckCheck className={`${iconClass} text-muted-foreground`} />;
      case 'read':
        return <CheckCheck className={`${iconClass} text-blue-500`} />;
      default:
        return <Check className={`${iconClass} text-muted-foreground`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full max-w-xs" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-1">
        {allMessages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showAvatar = !isOwn && (
            index === allMessages.length - 1 || 
            allMessages[index + 1]?.sender_id !== message.sender_id
          );
          const showName = !isOwn && (
            index === 0 || 
            allMessages[index - 1]?.sender_id !== message.sender_id
          );

          return (
            <div
              key={message.id}
              className={`flex gap-3 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && (
                <div className="w-8 flex justify-center">
                  {showAvatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={message.sender?.avatar_url || '/placeholder.svg'} 
                        alt={message.sender?.display_name || 'User'} 
                      />
                      <AvatarFallback className="text-xs">
                        {message.sender?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}
              
              <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && !isOwn && (
                  <span className="text-xs font-medium text-muted-foreground px-3">
                    {message.sender?.display_name || message.sender?.username || 'Unknown'}
                  </span>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 relative group ${
                    isOwn
                      ? 'bg-primary text-primary-foreground ml-auto rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {message.image_url && (
                    <div className="mb-2">
                      <img
                        src={message.image_url}
                        alt="Message attachment"
                        className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                  )}
                  
                  {message.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs opacity-70 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(message.created_at)}
                    </span>
                    {renderMessageStatus(message, isOwn)}
                  </div>
                </div>
              </div>
              
              {isOwn && <div className="w-8" />}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesList;
