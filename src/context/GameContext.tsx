
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Game types
type GameType = 'snake' | 'tetris' | 'trivia';

interface GameContextType {
  gameScores: Record<GameType, number>;
  updateGameScore: (game: GameType, score: number) => void;
  bestScores: Record<GameType, number>;
  isLoading: boolean;
  hasDailyRewardAvailable: boolean;
  claimDailyReward: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameScores, setGameScores] = useState<Record<GameType, number>>({
    snake: 0,
    tetris: 0,
    trivia: 0
  });
  
  const [bestScores, setBestScores] = useState<Record<GameType, number>>({
    snake: 0,
    tetris: 0,
    trivia: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasDailyRewardAvailable, setHasDailyRewardAvailable] = useState(false);
  
  const { toast } = useToast();
  const { user, addCoins } = useAuth();
  
  // Fetch best scores from the database
  useEffect(() => {
    const fetchBestScores = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('game_history')
          .select('game_type, score')
          .eq('user_id', user.id)
          .order('score', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Process the data to get best scores for each game
        const scores: Record<GameType, number> = {
          snake: 0,
          tetris: 0,
          trivia: 0
        };
        
        if (data) {
          data.forEach(record => {
            const gameType = record.game_type as GameType;
            if (gameType && scores[gameType] < record.score) {
              scores[gameType] = record.score;
            }
          });
        }
        
        setBestScores(scores);
      } catch (error) {
        console.error('Error fetching game scores:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your game scores'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBestScores();
  }, [user, toast]);
  
  // Check if daily reward is available
  useEffect(() => {
    const checkDailyReward = async () => {
      if (!user) return;
      
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const { data, error } = await supabase
          .from('daily_rewards')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', today)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        // If no record found for today, then reward is available
        setHasDailyRewardAvailable(!data);
      } catch (error) {
        console.error('Error checking daily reward:', error);
        toast({
          title: 'Error',
          description: 'Failed to check daily reward status'
        });
      }
    };
    
    checkDailyReward();
    
    // Check every minute if the day has changed
    const interval = setInterval(() => {
      checkDailyReward();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, toast]);
  
  const updateGameScore = async (game: GameType, score: number) => {
    if (!user) return;
    
    try {
      // Update local state
      setGameScores(prev => ({
        ...prev,
        [game]: score
      }));
      
      // If this is a new best score, update that too
      if (score > bestScores[game]) {
        setBestScores(prev => ({
          ...prev,
          [game]: score
        }));
        
        // Add to database
        const { error } = await supabase
          .from('game_history')
          .insert({
            user_id: user.id,
            game_type: game,
            score: score
          });
          
        if (error) {
          throw error;
        }
        
        // Show toast message
        toast({
          title: 'New High Score!',
          description: `You've set a new record for ${game}: ${score} points`
        });
        
        // Reward coins for high scores
        if (game === 'snake' && score > 10) {
          addCoins(Math.floor(score / 10), 'Snake game score');
        } else if (game === 'tetris' && score > 100) {
          addCoins(Math.floor(score / 100), 'Tetris game score');
        } else if (game === 'trivia' && score > 5) {
          addCoins(score, 'Trivia game score');
        }
      }
    } catch (error) {
      console.error('Error updating game score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your game score'
        
      });
    }
  };
  
  const claimDailyReward = async () => {
    if (!user || !hasDailyRewardAvailable) return;
    
    try {
      const coinsRewarded = 25; // Standard daily reward
      
      // Record the reward
      const { error } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: coinsRewarded
        });
        
      if (error) {
        throw error;
      }
      
      // Update user's coin balance
      addCoins(coinsRewarded, 'Daily login reward');
      
      // Update state to show reward has been claimed
      setHasDailyRewardAvailable(false);
      
      // Show success toast
      toast({
        title: 'Daily Reward Claimed!',
        description: `You've received ${coinsRewarded} coins. Come back tomorrow for more!`
      });
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim your daily reward'
      });
    }
  };
  
  return (
    <GameContext.Provider
      value={{
        gameScores,
        updateGameScore,
        bestScores,
        isLoading,
        hasDailyRewardAvailable,
        claimDailyReward
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
