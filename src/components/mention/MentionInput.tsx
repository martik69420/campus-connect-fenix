import React, { useState, useRef, useEffect } from 'react';
import MentionSuggestions from './MentionSuggestions';

interface MentionInputProps {
  onMention: (mention: string) => void;
}

const MentionInput: React.FC<MentionInputProps> = ({ onMention }) => {
  const [inputValue, setInputValue] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
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
      setMentionSuggestions(filteredUsers);
      setIsSuggestionsOpen(true);
    } else {
      setMentionSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  };

  const handleMentionSelect = (mention: string) => {
    setInputValue(mention + ' ');
    setMentionSuggestions([]);
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
      {isSuggestionsOpen && (
        <MentionSuggestions
          suggestions={mentionSuggestions}
          onSelect={handleMentionSelect}
        />
      )}
    </div>
  );
};

export default MentionInput;
