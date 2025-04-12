
import React, { useRef, useState, useEffect } from 'react';
import { MentionSuggestions } from './MentionSuggestions';
import { useMentions } from '@/hooks/use-mentions';
import { cn } from '@/lib/utils';

interface MentionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, placeholder, className, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef || innerRef) as React.RefObject<HTMLTextAreaElement>;
    
    const {
      mentionQuery,
      mentionPosition,
      handleInput,
      handleKeyDown,
      insertMention,
      resetMention
    } = useMentions(ref);

    // Resize textarea based on content
    useEffect(() => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    }, [value, ref]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    // Format text with highlighted mentions
    const formatTextWithMentions = (text: string): React.ReactNode => {
      if (!text) return null;
      
      const mentionRegex = /@(\w+)/g;
      const parts: React.ReactNode[] = [];
      
      let lastIndex = 0;
      let match;
      
      while ((match = mentionRegex.exec(text)) !== null) {
        const beforeMention = text.slice(lastIndex, match.index);
        if (beforeMention) {
          parts.push(beforeMention);
        }
        
        parts.push(
          <span key={`mention-${match.index}`} className="mention-highlight">
            @{match[1]}
          </span>
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      
      return parts;
    };

    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        
        {mentionQuery !== null && mentionPosition && (
          <MentionSuggestions
            query={mentionQuery}
            position={mentionPosition}
            onSelect={insertMention}
          />
        )}
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";
