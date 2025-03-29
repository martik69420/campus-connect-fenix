import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/LanguageContext';

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
  tetris: {
    highScore: number;
    gamesPlayed: number;
    lastPlayed?: Date;
  };
};

// Context type
type GameContextType = {
  progress: GameProgress;
  updateTriviaScore: (score: number) => void;
  updateSnakeScore: (score: number) => void;
  updateTetrisScore: (score: number) => void;
  hasDailyRewardAvailable: boolean;
  claimDailyReward: () => boolean;
  lastRewardClaimed: Date | null;
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const { user, addCoins } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [progress, setProgress] = useState<GameProgress>({
    trivia: {
      highScore: 0,
      gamesPlayed: 0,
    },
    snake: {
      highScore: 0,
      gamesPlayed: 0,
    },
    tetris: {
      highScore: 0,
      gamesPlayed: 0,
    }
  });
  
  const [lastRewardClaimed, setLastRewardClaimed] = useState<Date | null>(null);

  // Fetch game progress from database on component mount
  useEffect(() => {
    if (user) {
      fetchGameProgress();
    }
  }, [user]);

  // Fetch game progress from database
  const fetchGameProgress = async () => {
    if (!user) return;
    
    try {
      // Get game history for current user
      const { data: gameData, error: gameError } = await supabase
        .from('game_history')
        .select('game_type, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false });
        
      if (gameError) throw gameError;
      
      // Update progress state with data from database
      if (gameData && gameData.length > 0) {
        const newProgress = { ...progress };
        
        // Process trivia games
        const triviaGames = gameData.filter(game => game.game_type === 'trivia');
        if (triviaGames.length > 0) {
          newProgress.trivia.highScore = triviaGames[0].score; // First item is highest score due to ordering
          newProgress.trivia.gamesPlayed = triviaGames.length;
        }
        
        // Process snake games
        const snakeGames = gameData.filter(game => game.game_type === 'snake');
        if (snakeGames.length > 0) {
          newProgress.snake.highScore = snakeGames[0].score;
          newProgress.snake.gamesPlayed = snakeGames.length;
        }
        
        // Process tetris games
        const tetrisGames = gameData.filter(game => game.game_type === 'tetris');
        if (tetrisGames.length > 0) {
          newProgress.tetris.highScore = tetrisGames[0].score;
          newProgress.tetris.gamesPlayed = tetrisGames.length;
        }
        
        setProgress(newProgress);
      }
      
      // Get last reward claimed date
      const { data: rewardData, error: rewardError } = await supabase
        .from('daily_rewards')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (rewardError) throw rewardError;
      
      if (rewardData && rewardData.length > 0) {
        setLastRewardClaimed(new Date(rewardData[0].created_at));
      }
    } catch (error) {
      console.error('Error fetching game progress:', error);
    }
  };

  // Check if daily reward is available
  const hasDailyRewardAvailable = () => {
    if (!lastRewardClaimed) return true;
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return lastRewardClaimed < yesterday;
  };

  // Save daily reward to database
  const saveDailyReward = async (coinsRewarded: number) => {
    if (!user) return;
    
    try {
      await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: coinsRewarded
        });
    } catch (error) {
      console.error('Error saving daily reward:', error);
    }
  };

  // Save game score to database
  const saveGameScore = async (gameType: 'trivia' | 'snake' | 'tetris', score: number) => {
    if (!user) return;
    
    try {
      await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score: score
        });
      
      // Show toast for new high score - Using single object parameter
      toast({
        title: t('games.newHighScore'),
        description: t('games.scoreUpdated', { score: score.toString() })
      });
    } catch (error) {
      console.error(`Error saving ${gameType} score:`, error);
    }
  };

  // Claim daily reward
  const claimDailyReward = (): boolean => {
    if (!user) return false;
    
    if (hasDailyRewardAvailable()) {
      const rewardAmount = 25;
      addCoins(rewardAmount);
      setLastRewardClaimed(new Date());
      
      // Save reward to database
      saveDailyReward(rewardAmount);
      
      // Show toast for reward - Using single object parameter
      toast({
        title: t('earn.dailyReward'),
        description: t('earn.coinsAdded', { amount: '25' })
      });
      
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
        addCoins(score * 2);
        saveGameScore('trivia', score);
      } else {
        // Award some coins for playing
        addCoins(Math.floor(score / 2));
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
        addCoins(score * 2);
        saveGameScore('snake', score);
      } else {
        // Award some coins for playing
        addCoins(Math.floor(score / 2));
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

  // Update tetris game score
  const updateTetrisScore = (score: number) => {
    if (!user) return;
    
    setProgress(prev => {
      const newHighScore = score > prev.tetris.highScore;
      
      if (newHighScore) {
        // Award coins for new high score
        addCoins(score * 2);
        saveGameScore('tetris', score);
      } else {
        // Award some coins for playing
        addCoins(Math.floor(score / 2));
      }
      
      return {
        ...prev,
        tetris: {
          highScore: newHighScore ? score : prev.tetris.highScore,
          gamesPlayed: prev.tetris.gamesPlayed + 1,
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
        updateTetrisScore,
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
