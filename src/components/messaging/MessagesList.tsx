
import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
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

  const getMessageStatus = (message: Message, isOwn: boolean): 'sending' | 'sent' | 'delivered' | 'read' => {
    if (!isOwn) return 'read';
    if (message.status) return message.status;
    if (!message.id || message.id.startsWith('temp-')) return 'sending';
    if (message.is_read) return 'read';
    return 'delivered';
  };

  const renderMessageStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    
    const status = getMessageStatus(message, isOwn);
    const iconClass = "h-3 w-3";
    
    switch (status) {
      case 'sending':
        return <Clock className={`${iconClass} text-muted-foreground animate-pulse`} />;
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
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full max-w-xs rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
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
              key={message.id || `temp-${index}`}
              className={`flex gap-3 group hover:bg-muted/30 rounded-lg p-2 transition-colors ${
                isOwn ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isOwn && (
                <div className="w-10 flex justify-center items-end">
                  {showAvatar ? (
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage 
                        src={message.sender?.avatar_url || '/placeholder.svg'} 
                        alt={message.sender?.display_name || 'User'} 
                      />
                      <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {(message.sender?.display_name || message.sender?.username || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}
              
              <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && !isOwn && (
                  <span className="text-sm font-semibold text-foreground px-4">
                    {message.sender?.display_name || message.sender?.username || 'Unknown'}
                  </span>
                )}
                
                <div
                  className={`relative group/message ${
                    isOwn
                      ? 'bg-primary text-primary-foreground ml-auto rounded-[20px] rounded-br-md shadow-md'
                      : 'bg-muted text-foreground rounded-[20px] rounded-bl-md border border-border/50'
                  } ${getMessageStatus(message, isOwn) === 'sending' ? 'opacity-70' : 'opacity-100'}
                  px-4 py-3 max-w-full break-words transition-all duration-200 hover:shadow-lg`}
                >
                  {message.image_url && (
                    <div className="mb-3">
                      <img
                        src={message.image_url}
                        alt="Message attachment"
                        className="rounded-xl max-w-full h-auto max-h-80 object-cover border border-border/20"
                      />
                    </div>
                  )}
                  
                  {message.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  
                  <div className={`flex items-center gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${
                      isOwn 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </span>
                    {renderMessageStatus(message, isOwn)}
                  </div>
                </div>
              </div>
              
              {isOwn && <div className="w-10" />}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesList;
