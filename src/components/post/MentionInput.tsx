
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { useMentions } from '@/components/common/MentionsProvider';
import { useLanguage } from '@/context/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import { AtSign } from 'lucide-react';
import { useViewport } from '@/hooks/use-viewport';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'What\'s on your mind?',
  className = '',
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const { mentionUsers, loadingMentions, searchMentions, resetMentions } = useMentions();
  const { t } = useLanguage();
  const { isMobile } = useViewport();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  
  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionsRef.current && 
        !mentionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input changes and check for mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Check for mention pattern - @ followed by text
    const caretPos = e.target.selectionStart || 0;
    const textBeforeCaret = newValue.slice(0, caretPos);
    
    // Find the last @ symbol and any text after it up to the caret
    const mentionMatch = textBeforeCaret.match(/(?:^|\s)@(\w*)$/);
    
    if (mentionMatch) {
      const searchText = mentionMatch[1].toLowerCase();
      setMentionQuery(searchText);
      searchMentions(searchText);
      
      // Calculate position
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setMentionPosition({ 
          top: rect.bottom + window.scrollY, 
          left: rect.left + window.scrollX + (mentionMatch.index || 0) * 8 // estimate position based on character width
        });
      }
      setShowMentions(true);
    } else {
      setMentionQuery(null);
      setShowMentions(false);
      resetMentions();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close mention suggestions on escape
    if (e.key === 'Escape' && showMentions) {
      e.preventDefault();
      setShowMentions(false);
    }
  };
  
  const insertMention = (username: string) => {
    if (!inputRef.current) return;
    
    const caretPos = inputRef.current.selectionStart || 0;
    const textBeforeCaret = value.slice(0, caretPos);
    const textAfterCaret = value.slice(caretPos);
    
    // Find the position where the @ starts
    const lastAtSymbol = textBeforeCaret.lastIndexOf('@');
    if (lastAtSymbol === -1) return;
    
    // Replace the @query with @username
    const newValue = 
      textBeforeCaret.slice(0, lastAtSymbol) + 
      `@${username} ` + 
      textAfterCaret;
    
    onChange(newValue);
    setShowMentions(false);
    
    // Focus back on the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = lastAtSymbol + username.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };
  
  return (
    <div className="relative w-full">
      <Textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('post.mention')}
        className={`min-h-[100px] resize-none ${className}`}
      />
      
      {showMentions && mentionPosition && (
        <div 
          ref={mentionsRef}
          className="absolute z-50 min-w-[250px] max-w-[300px]"
          style={isMobile ? {
            top: `${mentionPosition.top}px`,
            left: '50%',
            transform: 'translateX(-50%)'
          } : {
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`
          }}
        >
          <Command className="rounded-lg border shadow-md bg-popover">
            <CommandGroup heading="Mentions">
              {loadingMentions ? (
                <div className="p-2 text-center">
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : mentionUsers.length > 0 ? (
                mentionUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.username}
                    onSelect={() => insertMention(user.username)}
                    className="flex items-center gap-3 p-2 cursor-pointer"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {user.display_name?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.display_name}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </CommandItem>
                ))
              ) : mentionQuery ? (
                <div className="p-4 text-center flex items-center justify-center flex-col">
                  <AtSign className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                  <span className="text-sm text-muted-foreground">
                    No users found matching "{mentionQuery}"
                  </span>
                </div>
              ) : null}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
