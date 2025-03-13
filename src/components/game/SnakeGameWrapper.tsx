
import React, { useEffect } from 'react';
import SnakeGame from './SnakeGame';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const SnakeGameWrapper: React.FC = () => {
  const { toast } = useToast();
  const { updateSnakeScore } = useGame();
  const { addCoins } = useAuth();

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

  const handleGameEnd = async (score: number) => {
    try {
      // Update snake game score in game context
      updateSnakeScore(score);

      // Award additional coins if the score is high enough
      if (score > 50) {
        addCoins(Math.floor(score / 10), "Snake game reward");
        toast({
          title: "Coins Awarded!",
          description: `You earned ${Math.floor(score / 10)} coins from your Snake game score.`,
        });
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }
  };

  return (
    <div className="touch-none">
      <SnakeGame onGameEnd={handleGameEnd} />
    </div>
  );
};

export default SnakeGameWrapper;
