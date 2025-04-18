
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Paperclip, Loader2, Image, Mic } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isSending, disabled }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset submitting state when isSending changes to false
  useEffect(() => {
    if (!isSending && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isSending, isSubmitting]);

  const handleSend = async () => {
    if (message.trim() && !isSending && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await onSendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: "Failed to send message",
          description: "Your message could not be sent. Please try again.",
          variant: "destructive"
        });
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

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleFeatureNotReady = () => {
    toast({
      description: "This feature is coming soon!",
    });
  };

  return (
    <div className="border-t p-3 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[150px] flex-1 resize-none py-2 px-3 focus-visible:ring-1 focus-visible:ring-primary"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending || isSubmitting || disabled}
          rows={1}
        />
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSending || isSubmitting || disabled}
                  onClick={handleFeatureNotReady}
                >
                  <Image className="h-5 w-5" />
                  <span className="sr-only">Attach image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>
          
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSending || isSubmitting || disabled}
                  onClick={handleFeatureNotReady}
                >
                  <Paperclip className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSending || isSubmitting || disabled}
                  onClick={handleFeatureNotReady}
                >
                  <Smile className="h-5 w-5" />
                  <span className="sr-only">Add emoji</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add emoji</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="default"
            size="icon"
            disabled={!message.trim() || isSending || isSubmitting || disabled}
            onClick={handleSend}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            {isSending || isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
