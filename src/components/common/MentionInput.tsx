
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

interface UserSuggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  rows = 3,
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(0);
  const [recentMentions, setRecentMentions] = useState<UserSuggestion[]>([]);

  // Get the current cursor position and text before cursor
  const getCurrentMentionQuery = () => {
    const input = inputRef.current;
    if (!input) return null;

    const cursorPosition = input.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // Find the last @ symbol
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol >= 0) {
      // Check if there's any whitespace between @ and cursor
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.slice(1); // Remove the @ symbol
        return {
          query,
          position: lastAtSymbol
        };
      }
    }
    
    return null;
  };

  // Load recent mentions from local storage
  useEffect(() => {
    const savedMentions = localStorage.getItem('recentMentions');
    if (savedMentions) {
      try {
        setRecentMentions(JSON.parse(savedMentions));
      } catch (e) {
        console.error('Error parsing recent mentions:', e);
      }
    }
  }, []);

  // Save recent mentions to local storage
  const saveRecentMention = (user: UserSuggestion) => {
    const updatedMentions = [
      user,
      ...recentMentions.filter(m => m.id !== user.id)
    ].slice(0, 5); // Keep only the 5 most recent mentions
    
    setRecentMentions(updatedMentions);
    localStorage.setItem('recentMentions', JSON.stringify(updatedMentions));
  };

  // Fetch users for suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 1) {
      // Show recent mentions if query is empty
      setSuggestions(recentMentions);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.${query}%,display_name.ilike.${query}%`)
        .limit(5);
        
      if (error) throw error;
      
      // If we have results, return them
      if (data && data.length > 0) {
        setSuggestions(data);
        return;
      }
      
      // If no exact matches, try a more lenient search
      const { data: fuzzyData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);
      
      setSuggestions(fuzzyData || []);
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      setSuggestions([]);
    }
  };

  // Position the suggestion popover near the current @ mention
  const positionSuggestions = () => {
    const input = inputRef.current;
    if (!input) return;
    
    const mentionData = getCurrentMentionQuery();
    if (!mentionData) return;
    
    // Get the text until the mention start position
    const textUntilMention = value.substring(0, mentionData.position);
    
    // Create a hidden div to measure position
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.width = `${input.clientWidth}px`;
    measurer.style.fontSize = window.getComputedStyle(input).fontSize;
    measurer.style.lineHeight = window.getComputedStyle(input).lineHeight;
    measurer.style.whiteSpace = 'pre-wrap';
    measurer.style.wordBreak = 'break-word';
    measurer.style.overflowWrap = 'break-word';
    measurer.style.paddingLeft = window.getComputedStyle(input).paddingLeft;
    measurer.style.paddingRight = window.getComputedStyle(input).paddingRight;
    measurer.innerHTML = textUntilMention.replace(/\n/g, '<br>');
    
    document.body.appendChild(measurer);
    
    // Get the position of the last line
    const measurerRect = measurer.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    
    const lastChar = measurer.innerHTML.lastIndexOf('<br>') !== -1
      ? measurer.innerHTML.lastIndexOf('<br>') + 4 // +4 for <br>
      : 0;
      
    const lastLine = document.createElement('span');
    lastLine.innerHTML = measurer.innerHTML.substring(lastChar);
    measurer.appendChild(lastLine);
    const lastLineRect = lastLine.getBoundingClientRect();
    
    document.body.removeChild(measurer);
    
    // Calculate position
    const top = lastLineRect.top - inputRect.top + lastLineRect.height + 5;
    const left = lastLineRect.left - inputRect.left;
    
    setPosition({
      top,
      left: Math.max(0, left)
    });
  };

  // Handle input changes and detect mention patterns
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const mentionData = getCurrentMentionQuery();
    
    if (mentionData) {
      setQuery(mentionData.query);
      setMentionStart(mentionData.position);
      setShowSuggestions(true);
      setSelectedIndex(0);
      fetchSuggestions(mentionData.query);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation through suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
      case 'Tab':
        if (suggestions.length > 0) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Insert the selected mention into the text
  const insertMention = (user: UserSuggestion) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(inputRef.current?.selectionStart || 0);
    
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    saveRecentMention(user);
    
    // Set focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = mentionStart + user.username.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  // Handle click outside to close the suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update the position of suggestions when query changes
  useEffect(() => {
    if (showSuggestions) {
      positionSuggestions();
    }
  }, [query, showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        disabled={disabled}
      />
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            ref={popoverRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-64 max-h-60 overflow-auto bg-popover text-popover-foreground shadow-md rounded-md border border-border"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px`,
            }}
          >
            <div className="p-1">
              {/* Header for the suggestion panel */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center border-b mb-1">
                <AtSign className="h-3 w-3 mr-1" />
                {query ? `Matching "${query}"` : "Recent mentions"}
              </div>
              
              {suggestions.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ backgroundColor: "transparent" }}
                  animate={{ 
                    backgroundColor: index === selectedIndex ? "hsl(var(--muted))" : "transparent"
                  }}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted`}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
                    <AvatarFallback>
                      {user.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate flex items-center justify-between">
                      <span>{user.display_name}</span>
                      {index === selectedIndex && <Check className="h-3 w-3 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </motion.div>
              ))}
              
              {suggestions.length === 0 && query && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No users found matching "{query}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentionInput;
