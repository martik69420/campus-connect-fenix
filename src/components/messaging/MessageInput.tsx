
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Paperclip, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isSending, disabled }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (message.trim() && !isSending) {
      try {
        await onSendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  return (
    <div className="border-t p-3 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          placeholder={t('messages.typeMessage')}
          className="min-h-[40px] max-h-[150px] flex-1 resize-none py-2 px-3 focus-visible:ring-1 focus-visible:ring-primary"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending || disabled}
          rows={1}
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSending || disabled}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">{t('messages.attachFile')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSending || disabled}
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">{t('messages.addEmoji')}</span>
          </Button>
          <Button
            variant="default"
            size="icon"
            disabled={!message.trim() || isSending || disabled}
            onClick={handleSend}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">{t('messages.send')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
