
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GameProgressType {
  gamesPlayed: number;
  highScore: number;
}

interface GameState {
  lastDailyReward: string | null;
  triviaQuestions: any[];
  currentTriviaQuestion: number;
  score: number;
  progress: {
    snake: GameProgressType;
    tetris: GameProgressType;
    trivia: GameProgressType;
  };
}

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  loading: boolean;
  claimDailyReward: () => Promise<void>;
  fetchTriviaQuestions: () => Promise<void>;
  hasDailyRewardAvailable: boolean;
  updateSnakeScore: (score: number) => Promise<void>;
  updateTetrisScore: (score: number) => Promise<void>;
  updateTriviaScore: (score: number) => Promise<void>;
}

const defaultGameState: GameState = {
  lastDailyReward: null,
  triviaQuestions: [],
  currentTriviaQuestion: 0,
  score: 0,
  progress: {
    snake: { gamesPlayed: 0, highScore: 0 },
    tetris: { gamesPlayed: 0, highScore: 0 },
    trivia: { gamesPlayed: 0, highScore: 0 }
  }
};

const GameContext = createContext<GameContextType>({
  gameState: defaultGameState,
  setGameState: () => {},
  loading: false,
  claimDailyReward: async () => {},
  fetchTriviaQuestions: async () => {},
  hasDailyRewardAvailable: false,
  updateSnakeScore: async () => {},
  updateTetrisScore: async () => {},
  updateTriviaScore: async () => {}
});

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [loading, setLoading] = useState(false);
  const [hasDailyRewardAvailable, setHasDailyRewardAvailable] = useState(false);
  const { user, addCoins } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const claimDailyReward = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      
      // Check if user has already claimed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingRewards, error: checkError } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .maybeSingle();
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingRewards) {
        toast({
          title: t('earn.alreadyClaimed'),
          description: t('earn.comeBackTomorrow')
        });
        return;
      }
      
      // Award coins
      const coinsToAward = 50;
      
      // Record the reward in database
      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: coinsToAward
        });
      
      if (rewardError) {
        throw rewardError;
      }
      
      // Update user coins
      addCoins(coinsToAward, t('earn.dailyRewardClaimed'));
      
      // Update state
      setGameState(prev => ({
        ...prev,
        lastDailyReward: new Date().toISOString()
      }));
      
      toast({
        title: t('earn.dailyRewardClaimed'),
        description: t('earn.youEarned', { coins: coinsToAward })
      });
      
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      toast({
        title: t('error.title'),
        description: t('error.tryAgain')
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTriviaQuestions = async () => {
    try {
      setLoading(true);
      
      // Mock trivia questions since the table doesn't exist
      const mockTriviaQuestions = [
        {
          id: '1',
          question: 'What is the capital of France?',
          options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
          correct_answer: 'Paris',
          category: 'Geography',
          difficulty: 'easy'
        },
        {
          id: '2',
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correct_answer: 'Mars',
          category: 'Science',
          difficulty: 'easy'
        },
        {
          id: '3',
          question: 'Who painted the Mona Lisa?',
          options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
          correct_answer: 'Leonardo da Vinci',
          category: 'Art',
          difficulty: 'medium'
        }
      ];
      
      setGameState(prev => ({
        ...prev,
        triviaQuestions: mockTriviaQuestions,
        currentTriviaQuestion: 0,
        progress: {
          ...prev.progress,
          trivia: prev.progress.trivia
        }
      }));
      
      toast({
        title: t('trivia.questionsLoaded'),
        description: t('trivia.getReady')
      });
      
    } catch (error) {
      console.error("Error fetching trivia questions:", error);
      toast({
        title: t('error.title'),
        description: t('error.tryAgain')
      });
    } finally {
      setLoading(false);
    }
  };

  // Add game score update functions
  const updateGameScore = async (gameType: string, score: number) => {
    if (!user) return;
    
    try {
      // Record score in database
      const { error } = await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score: score
        });
        
      if (error) throw error;
      
      // Award coins based on the score
      const coinsToAward = Math.floor(score / 10);
      if (coinsToAward > 0) {
        addCoins(coinsToAward, `${t('games.earnedFrom')} ${gameType}`);
      }
      
      toast({
        title: t('games.scoreRecorded'),
        description: t('games.scoreValue', { score })
      });
      
    } catch (error) {
      console.error(`Error recording ${gameType} score:`, error);
      toast({
        title: t('error.title'),
        description: t('error.tryAgain')
      });
    }
  };
  
  const updateSnakeScore = async (score: number) => {
    await updateGameScore('Snake', score);
  };
  
  const updateTetrisScore = async (score: number) => {
    await updateGameScore('Tetris', score);
  };
  
  const updateTriviaScore = async (score: number) => {
    await updateGameScore('Trivia', score);
    
    setGameState(prev => ({
      ...prev,
      score
    }));
  };

  const value: GameContextType = {
    gameState,
    setGameState,
    loading,
    claimDailyReward,
    fetchTriviaQuestions,
    hasDailyRewardAvailable,
    updateSnakeScore,
    updateTetrisScore,
    updateTriviaScore
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export { GameContext };
