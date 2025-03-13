
import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

// Mini game progress type
export type GameProgress = {
  trivia: {
    highScore: number;
    gamesPlayed: number;
    lastPlayed?: Date;
  };
  snake: {
    highScore: number;
    gamesPlayed: number;
    lastPlayed?: Date;
  };
  // Add more games as needed
};

// Context type
type GameContextType = {
  progress: GameProgress;
  updateTriviaScore: (score: number) => void;
  updateSnakeScore: (score: number) => void;
  hasDailyRewardAvailable: boolean;
  claimDailyReward: () => boolean;
  lastRewardClaimed: Date | null;
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addCoins } = useAuth();
  const [progress, setProgress] = useState<GameProgress>({
    trivia: {
      highScore: 0,
      gamesPlayed: 0,
    },
    snake: {
      highScore: 0,
      gamesPlayed: 0,
    }
  });
  
  const [lastRewardClaimed, setLastRewardClaimed] = useState<Date | null>(null);

  // Check if daily reward is available
  const hasDailyRewardAvailable = () => {
    if (!lastRewardClaimed) return true;
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return lastRewardClaimed < yesterday;
  };

  // Claim daily reward
  const claimDailyReward = (): boolean => {
    if (!user) return false;
    
    if (hasDailyRewardAvailable()) {
      addCoins(25, "Daily login reward");
      setLastRewardClaimed(new Date());
      return true;
    }
    
    return false;
  };

  // Update trivia game score
  const updateTriviaScore = (score: number) => {
    if (!user) return;
    
    setProgress(prev => {
      const newHighScore = score > prev.trivia.highScore;
      
      if (newHighScore) {
        // Award coins for new high score
        addCoins(score * 2, "New trivia high score");
      } else {
        // Award some coins for playing
        addCoins(Math.floor(score / 2), "Trivia game played");
      }
      
      return {
        ...prev,
        trivia: {
          highScore: newHighScore ? score : prev.trivia.highScore,
          gamesPlayed: prev.trivia.gamesPlayed + 1,
          lastPlayed: new Date()
        }
      };
    });
  };

  // Update snake game score
  const updateSnakeScore = (score: number) => {
    if (!user) return;
    
    setProgress(prev => {
      const newHighScore = score > prev.snake.highScore;
      
      if (newHighScore) {
        // Award coins for new high score
        addCoins(score * 2, "New snake high score");
      } else {
        // Award some coins for playing
        addCoins(Math.floor(score / 2), "Snake game played");
      }
      
      return {
        ...prev,
        snake: {
          highScore: newHighScore ? score : prev.snake.highScore,
          gamesPlayed: prev.snake.gamesPlayed + 1,
          lastPlayed: new Date()
        }
      };
    });
  };

  return (
    <GameContext.Provider
      value={{
        progress,
        updateTriviaScore,
        updateSnakeScore,
        hasDailyRewardAvailable: hasDailyRewardAvailable(),
        claimDailyReward,
        lastRewardClaimed
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
