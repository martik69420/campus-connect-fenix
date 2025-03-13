
import React, { useEffect } from 'react';
import SnakeGame from './SnakeGame';

const SnakeGameWrapper: React.FC = () => {
  // Prevent arrow keys from scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
           'Space', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="touch-none">
      <SnakeGame />
    </div>
  );
};

export default SnakeGameWrapper;
