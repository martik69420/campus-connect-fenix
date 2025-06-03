
import React from 'react';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    gestures: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌'],
    objects: ['💯', '💥', '💫', '💦', '💨', '🔥', '⭐', '🌟', '✨', '⚡', '☄️', '💎', '🔮', '🏆', '🎉', '🎊'],
    symbols: ['😂', '❤️', '😍', '😘', '😊', '🤗', '🤔', '😅', '😃', '😄', '😁', '😆', '🙂', '😉', '😌', '😙', '😗', '🤤', '😋', '🤓']
  };

  const [activeCategory, setActiveCategory] = React.useState('smileys');

  return (
    <div className="bg-background border rounded-lg shadow-lg">
      {/* Category tabs */}
      <div className="flex border-b">
        {Object.keys(emojiCategories).map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "ghost"}
            size="sm"
            className="flex-1 rounded-none"
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[activeCategory as keyof typeof emojiCategories].map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
