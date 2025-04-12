
import React, { useState, useEffect } from 'react';
import SnakeGame from './SnakeGame';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { SnakeGameProps, SnakeGameState } from './SnakeGameTypes';

interface SnakeGameWrapperProps {
  onGameEnd: (score: number) => Promise<void>;
}

const SnakeGameWrapper: React.FC<SnakeGameWrapperProps> = ({ onGameEnd }) => {
  const [score, setScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Key to force remount of SnakeGame on restart

  const handleStartGame = () => {
    setIsGameStarted(true);
    setIsPaused(false);
    setScore(0);
    setGameKey(prevKey => prevKey + 1); // Update key to remount SnakeGame
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleScore = (newScore: number) => {
    setScore(newScore);
  };

  const handleGameOver = async () => {
    setIsGameStarted(false);
    await onGameEnd(score);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Score: {score}</div>
        {!isGameStarted && (
          <Button onClick={handleStartGame}>
            <PlayIcon className="mr-2 h-4 w-4" />
            Start Game
          </Button>
        )}
        {isGameStarted && (
          <Button onClick={handlePauseResume}>
            {isPaused ? (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <PauseIcon className="mr-2 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>
      
      {isGameStarted && (
        <div className="relative">
          <SnakeGame 
            key={gameKey} 
            onGameEnd={handleGameOver}
          />
          
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
              <div className="text-3xl font-bold text-white">Paused</div>
            </div>
          )}
        </div>
      )}
      
      {!isGameStarted && score > 0 && (
        <div className="text-center">
          Game Over! Your score: {score}
        </div>
      )}
    </div>
  );
};

export default SnakeGameWrapper;
