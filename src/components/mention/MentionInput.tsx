
import React, { useState, useRef, useEffect, TextareaHTMLAttributes } from 'react';
import { User } from '@/context/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// We need to define our own props interface that properly extends TextareaHTMLAttributes
interface MentionInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onMention?: (user: User) => void;
  placeholder?: string;
  className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  placeholder = 'Write something...',
  className,
  ...textareaProps
}) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Check for mention pattern
    const lastAtSymbolIndex = newValue.lastIndexOf('@');
    const cursorPosition = e.target.selectionStart;
    
    if (lastAtSymbolIndex !== -1 && 
        cursorPosition > lastAtSymbolIndex && 
        (!mentionStart || mentionStart <= lastAtSymbolIndex)) {
      const potentialQuery = newValue.slice(lastAtSymbolIndex + 1, cursorPosition);
      if (!potentialQuery.includes(' ')) {
        setMentionQuery(potentialQuery);
        setMentionStart(lastAtSymbolIndex);
        setShowResults(true);
        searchUsers(potentialQuery);
      } else {
        resetMentionState();
      }
    } else if (mentionStart && (cursorPosition <= mentionStart || newValue[mentionStart] !== '@')) {
      resetMentionState();
    }
  };

  // Reset mention state
  const resetMentionState = () => {
    setMentionQuery('');
    setMentionResults([]);
    setShowResults(false);
    setMentionStart(null);
  };
  
  // Search for users to mention
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setMentionResults([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', `${query}%`)
        .order('username')
        .limit(5);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedUsers = data.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name,
        })) as User[];
        
        setMentionResults(formattedUsers);
      }
    } catch (error) {
      console.error("Error searching for users:", error);
      setMentionResults([]);
    }
  };

  // Handle selecting a mention
  const selectMention = (user: User) => {
    if (mentionStart !== null && textareaRef.current) {
      const beforeMention = value.slice(0, mentionStart);
      const afterMention = value.slice(textareaRef.current.selectionStart);
      
      // Replace the @query with the selected username
      const newValue = `${beforeMention}@${user.username} ${afterMention}`;
      onChange(newValue);
      
      // Call onMention callback if provided
      if (onMention) {
        onMention(user);
      }
      
      // Reset mention state
      resetMentionState();
      
      // Focus the textarea with the cursor after the inserted mention
      const newCursorPosition = mentionStart + user.username.length + 2; // +2 for @ and space
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && 
          !resultsRef.current.contains(event.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(event.target as Node)) {
        resetMentionState();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Map changes to original onChange format for compatibility
  const handleChangeEvent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange(e);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChangeEvent}
        placeholder={placeholder}
        className={cn(
          "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...textareaProps}
      />
      
      {showResults && mentionResults.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute z-10 mt-1 w-64 max-h-48 overflow-auto rounded-md border bg-popover shadow-md"
        >
          <div className="p-1">
            {mentionResults.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => selectMention(user)}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  <span className="text-xs font-medium">
                    {user.displayName?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
