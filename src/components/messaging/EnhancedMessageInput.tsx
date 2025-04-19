
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Paperclip, Image, Smile } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from '@/context/ThemeContext';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  isSending: boolean;
  disabled?: boolean;
}

const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  isSending,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { theme } = useTheme();

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setEmojiPickerOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-md">
          {attachments.map((file, index) => (
            <div key={index} className="relative group">
              {file.type.startsWith('image/') ? (
                <div className="h-16 w-16 rounded-md overflow-hidden bg-background border">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 flex items-center justify-center rounded-md bg-background border">
                  <Paperclip className="h-5 w-5 opacity-70" />
                </div>
              )}
              <button 
                className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full 
                          flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeAttachment(index)}
              >
                ×
              </button>
              <span className="absolute -bottom-1 left-0 right-0 text-[10px] truncate text-center bg-black/60 text-white">
                {file.name.length > 10 ? file.name.substring(0, 7) + '...' : file.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            placeholder={t('messages.typeMessage')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={disabled || isSending}
            className="min-h-[60px] max-h-[120px] resize-none pr-10 bg-muted/10 focus-visible:ring-primary/30"
          />
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 absolute bottom-2 right-2 hover:bg-muted/30 rounded-full"
                disabled={disabled || isSending}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none bg-transparent" side="top" align="end">
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme={theme === 'dark' ? 'dark' : 'light'}
                previewPosition="none"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={disabled || isSending}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full"
            title={t('messages.attachFile')}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            disabled={disabled || isSending || (message.trim().length === 0 && attachments.length === 0)}
            onClick={handleSend}
            className="rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageInput;
