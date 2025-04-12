
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/auth';
import SnakeGame from './SnakeGame';

const SnakeGameWrapper: React.FC = () => {
  const [gameKey, setGameKey] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();
  const { updateGameScore, bestScores } = useGame();
  const { addCoins, user } = useAuth();
  
  // Handle game over
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameOver(true);
    
    // Update the best score if needed
    updateGameScore('snake', finalScore);
    
    // Award coins based on score
    if (finalScore > 0) {
      const coinsEarned = Math.floor(finalScore / 10);
      if (coinsEarned > 0) {
        addCoins(coinsEarned, `Snake game score: ${finalScore}`);
        
        toast({
          title: "Coins earned!",
          description: `You earned ${coinsEarned} coins for your snake game score.`,
        });
      }
    }
  };
  
  // Restart the game
  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setGameKey(prev => prev + 1);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <p className="text-lg font-medium">Current Score: <span className="text-primary font-bold">{score}</span></p>
        <p className="text-sm">Best Score: <span className="font-bold">{bestScores.snake}</span></p>
      </div>
      
      <Card className="w-full max-w-md border-2 overflow-hidden">
        <CardContent className="p-0">
          <SnakeGame 
            key={gameKey}
            onGameOver={handleGameOver}
          />
        </CardContent>
      </Card>
      
      {gameOver && (
        <div className="mt-6 text-center">
          <h3 className="text-xl font-bold mb-2">Game Over!</h3>
          <p className="mb-4">Your score: <span className="text-primary font-bold">{score}</span></p>
          <Button onClick={restartGame}>Play Again</Button>
        </div>
      )}
      
      <div className="mt-6 text-sm text-muted-foreground">
        <p>How to play:</p>
        <p>Use arrow keys to change direction. Collect food to grow longer.</p>
        <p>Don't crash into the walls or yourself!</p>
      </div>
    </div>
  );
};

export default SnakeGameWrapper;
