
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

// Game types
type GameType = 'snake' | 'tetris' | 'trivia';

// Game state structure
interface GameState {
  progress: {
    snake: { gamesPlayed: number; highScore: number };
    tetris: { gamesPlayed: number; highScore: number };
    trivia: { gamesPlayed: number; highScore: number };
  };
}

interface User {
  id: string;
  username: string;
  displayName: string;
  coins?: number;
}

interface GameContextType {
  gameScores: Record<GameType, number>;
  updateGameScore: (game: GameType, score: number) => void;
  bestScores: Record<GameType, number>;
  isLoading: boolean;
  hasDailyRewardAvailable: boolean;
  claimDailyReward: () => void;
  
  // Add missing methods for specific game score updates
  updateSnakeScore: (score: number) => void;
  updateTetrisScore: (score: number) => void;
  updateTriviaScore: (score: number) => void;
  
  // Add game state
  gameState: GameState;
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
  const { user: currentUser } = useAuth();
  
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
  
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    progress: {
      snake: { gamesPlayed: 0, highScore: 0 },
      tetris: { gamesPlayed: 0, highScore: 0 },
      trivia: { gamesPlayed: 0, highScore: 0 }
    }
  });
  
  // Fetch best scores from the database
  useEffect(() => {
    const fetchBestScores = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('game_history')
          .select('game_type, score')
          .eq('user_id', currentUser.id)
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
        
        // Update game state with high scores
        setGameState(prevState => ({
          ...prevState,
          progress: {
            snake: { ...prevState.progress.snake, highScore: scores.snake },
            tetris: { ...prevState.progress.tetris, highScore: scores.tetris },
            trivia: { ...prevState.progress.trivia, highScore: scores.trivia }
          }
        }));
      } catch (error) {
        console.error('Error fetching game scores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBestScores();
  }, [currentUser]);
  
  // Check if daily reward is available
  useEffect(() => {
    const checkDailyReward = async () => {
      if (!currentUser) return;
      
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const { data, error } = await supabase
          .from('daily_rewards')
          .select('created_at')
          .eq('user_id', currentUser.id)
          .gte('created_at', today)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        // If no record found for today, then reward is available
        setHasDailyRewardAvailable(!data);
      } catch (error) {
        console.error('Error checking daily reward:', error);
      }
    };
    
    checkDailyReward();
    
    // Check every minute if the day has changed
    const interval = setInterval(() => {
      checkDailyReward();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [currentUser]);
  
  const updateGameScore = async (game: GameType, score: number) => {
    if (!currentUser) return;
    
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
        
        // Update game state
        setGameState(prevState => ({
          ...prevState,
          progress: {
            ...prevState.progress,
            [game]: { 
              ...prevState.progress[game],
              highScore: score,
              gamesPlayed: prevState.progress[game].gamesPlayed + 1
            }
          }
        }));
        
        // Add to database
        const { error } = await supabase
          .from('game_history')
          .insert({
            user_id: currentUser.id,
            game_type: game,
            score: score
          });
          
        if (error) {
          throw error;
        }
        
        // Add coins for high scores
        if (game === 'snake' && score > 10) {
          await updateUserCoins(Math.floor(score / 10), 'Snake game score');
        } else if (game === 'tetris' && score > 100) {
          await updateUserCoins(Math.floor(score / 100), 'Tetris game score');
        } else if (game === 'trivia' && score > 5) {
          await updateUserCoins(score, 'Trivia game score');
        }
      } else {
        // Even if not a high score, increment games played
        setGameState(prevState => ({
          ...prevState,
          progress: {
            ...prevState.progress,
            [game]: { 
              ...prevState.progress[game],
              gamesPlayed: prevState.progress[game].gamesPlayed + 1
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error updating game score:', error);
    }
  };
  
  // Function to update user coins
  const updateUserCoins = async (amount: number, reason?: string) => {
    if (!currentUser) return false;
    
    try {
      // Update coins in database
      const { error } = await supabase
        .from('profiles')
        .update({ coins: (currentUser.coins || 0) + amount })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Log the transaction
      console.log(`Coin transaction for user ${currentUser.id}: ${amount} coins (${reason || 'No reason provided'})`);
      
      return true;
    } catch (error) {
      console.error("Error adding coins:", error);
      return false;
    }
  };
  
  // Game-specific update methods
  const updateSnakeScore = (score: number) => {
    updateGameScore('snake', score);
  };
  
  const updateTetrisScore = (score: number) => {
    updateGameScore('tetris', score);
  };
  
  const updateTriviaScore = (score: number) => {
    updateGameScore('trivia', score);
  };
  
  const claimDailyReward = async () => {
    if (!currentUser || !hasDailyRewardAvailable) return;
    
    try {
      const coinsRewarded = 25; // Standard daily reward
      
      // Record the reward
      const { error } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: currentUser.id,
          coins_rewarded: coinsRewarded
        });
        
      if (error) {
        throw error;
      }
      
      // Update user's coin balance - using the context function
      await updateUserCoins(coinsRewarded, 'Daily login reward');
      
      // Update state to show reward has been claimed
      setHasDailyRewardAvailable(false);
      
    } catch (error) {
      console.error('Error claiming daily reward:', error);
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
        claimDailyReward,
        updateSnakeScore,
        updateTetrisScore,
        updateTriviaScore,
        gameState
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
