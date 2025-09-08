
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Paperclip, Loader2, Image, X, FileImage, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker from '@/components/messaging/EmojiPicker';
import GifPicker from '@/components/messaging/GifPicker';
import PrebuiltGifs from '@/components/messaging/PrebuiltGifs';
import GifCreator from '@/components/messaging/GifCreator';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';

interface MessageInputProps {
  onSendMessage: (message: string, imageFile?: File, gifUrl?: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
  receiverId?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isSending, disabled, receiverId }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifDialog, setShowGifDialog] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingIndicatorRef = useRef<any>(null);

  const handleSend = async () => {
    if ((message.trim() || selectedImage || selectedGif) && !isSending) {
      try {
        await onSendMessage(message, selectedImage || undefined, selectedGif || undefined);
        setMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedGif(null);
        
        // Keep focus on textarea after sending
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
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

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifDialog(false);
    toast({
      title: "GIF Selected",
      description: "GIF added to your message"
    });
  };

  const removeGif = () => {
    setSelectedGif(null);
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

  // Focus the textarea when the component mounts and after messages
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle typing indicators
  const handleTypingChange = (typing: boolean) => {
    setIsTyping(typing);
  };

  // Trigger typing when user types
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator
    if (typingIndicatorRef.current && receiverId) {
      typingIndicatorRef.current.handleTyping();
    }
  };

  return (
    <div className="border-t p-3 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
      {/* Media Previews */}
      <div className="flex gap-3 mb-3">
        {imagePreview && (
          <div className="relative inline-block animate-bounce-in">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-32 max-h-32 rounded-lg object-cover border shadow-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 animate-bounce-in"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {selectedGif && (
          <div className="relative inline-block animate-bounce-in">
            <img 
              src={selectedGif} 
              alt="Selected GIF" 
              className="max-w-32 max-h-32 rounded-lg object-cover border shadow-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 animate-bounce-in"
              onClick={removeGif}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[150px] flex-1 resize-none py-2 px-3 focus-visible:ring-1 focus-visible:ring-primary"
          value={message}
          onChange={handleMessageChange}
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
                  className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  disabled={isSending || disabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-5 w-5" />
                  <span className="sr-only">Attach image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>

            <Dialog open={showGifDialog} onOpenChange={setShowGifDialog}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                      disabled={isSending || disabled}
                    >
                      <FileImage className="h-5 w-5" />
                      <span className="sr-only">Add GIF</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add GIF</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add GIF</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="search">Search</TabsTrigger>
                    <TabsTrigger value="popular">Popular</TabsTrigger>
                    <TabsTrigger value="create">Create</TabsTrigger>
                  </TabsList>
                  <TabsContent value="search" className="mt-4">
                    <GifPicker onGifSelect={handleGifSelect} />
                  </TabsContent>
                  <TabsContent value="popular" className="mt-4">
                    <PrebuiltGifs onGifSelect={handleGifSelect} />
                  </TabsContent>
                  <TabsContent value="create" className="mt-4">
                    <GifCreator onGifCreated={handleGifSelect} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
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
            disabled={(!message.trim() && !selectedImage && !selectedGif) || isSending || disabled}
            onClick={handleSend}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 animate-glow"
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
      
      {/* Typing Indicator Component */}
      {receiverId && (
        <TypingIndicator
          ref={typingIndicatorRef}
          receiverId={receiverId}
          onTypingChange={handleTypingChange}
        />
      )}
    </div>
  );
};

export default MessageInput;
