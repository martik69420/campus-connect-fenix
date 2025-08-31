
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Paperclip, Loader2, Image, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker from '@/components/messaging/EmojiPicker';

interface MessageInputProps {
  onSendMessage: (message: string, imageFile?: File) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isSending, disabled }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if ((message.trim() || selectedImage) && !isSending) {
      try {
        await onSendMessage(message, selectedImage || undefined);
        setMessage('');
        setSelectedImage(null);
        setImagePreview(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPos = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
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

  return (
    <div className="border-t p-3 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-32 max-h-32 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[150px] flex-1 resize-none py-2 px-3 focus-visible:ring-1 focus-visible:ring-primary"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending || disabled}
          rows={1}
        />
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  disabled={isSending || disabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-5 w-5" />
                  <span className="sr-only">Attach image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>
          
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  disabled={isSending || disabled}
                >
                  <Smile className="h-5 w-5" />
                  <span className="sr-only">Add emoji</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="top" align="end">
                <EmojiPicker onEmojiSelect={insertEmoji} />
              </PopoverContent>
            </Popover>
          </TooltipProvider>
          
          <Button
            variant="default"
            size="icon"
            disabled={(!message.trim() && !selectedImage) || isSending || disabled}
            onClick={handleSend}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageSelect}
      />
    </div>
  );
};

export default MessageInput;
