
import React, { useState, useRef, useEffect } from 'react';
import { MentionSuggestions, MentionSuggestionsProps } from './MentionSuggestions';

export interface MentionInputProps {
  onMention: (mention: string) => void;
}

const MentionInput: React.FC<MentionInputProps> = ({ onMention }) => {
  const [inputValue, setInputValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const users = ['john_doe', 'jane_smith', 'alice_wonder', 'bob_the_builder']; // Example user list

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.startsWith('@') && value.length > 1) {
      const searchText = value.substring(1).toLowerCase();
      const filteredUsers = users.filter(user =>
        user.toLowerCase().includes(searchText)
      );
      
      if (filteredUsers.length > 0) {
        setMentionQuery(searchText);
        // Calculate position
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setMentionPosition({ top: rect.bottom, left: rect.left });
        }
        setIsSuggestionsOpen(true);
      } else {
        setIsSuggestionsOpen(false);
      }
    } else {
      setMentionQuery(null);
      setIsSuggestionsOpen(false);
    }
  };

  const handleMentionSelect = (mention: string) => {
    setInputValue(mention + ' ');
    setIsSuggestionsOpen(false);
    onMention(mention);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder="Type @ to mention someone"
        className="border rounded p-2 w-full"
      />
      {isSuggestionsOpen && mentionPosition && mentionQuery !== null && (
        <MentionSuggestions
          query={mentionQuery}
          position={mentionPosition}
          onSelect={handleMentionSelect}
        />
      )}
    </div>
  );
};

export default MentionInput;
