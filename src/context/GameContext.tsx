
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Define game types
export type GameType = 'snake' | 'tetris' | 'trivia';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Define progress tracking interface
interface GameProgress {
  snake: {
    highScore: number;
    gamesPlayed: number;
  };
  tetris: {
    highScore: number;
    gamesPlayed: number;
  };
  trivia: {
    highScore: number;
    gamesPlayed: number;
    correctAnswers: number;
  };
}

// Define game state types
interface GameState {
  gameType: GameType | null;
  isPlaying: boolean;
  score: number;
  level: number;
  // Snake game state
  snakePosition: { x: number; y: number }[];
  foodPosition: { x: number; y: number };
  snakeDirection: Direction;
  // Tetris game state
  tetrisGrid: number[][];
  currentTetromino: number[][];
  tetrominoPosition: { x: number; y: number };
  // Trivia game state
  triviaQuestions: any[];
  currentQuestionIndex: number;
  selectedAnswerIndex: number | null;
  correctAnswers: number;
  // Game progress tracking
  progress: GameProgress;
  // Daily rewards
  lastRewardClaim: Date | null;
}

// Define initial game state
const initialGameState: GameState = {
  gameType: null,
  isPlaying: false,
  score: 0,
  level: 1,
  // Snake game state
  snakePosition: [{ x: 10, y: 10 }],
  foodPosition: { x: 5, y: 5 },
  snakeDirection: 'RIGHT',
  // Tetris game state
  tetrisGrid: Array(20).fill(null).map(() => Array(10).fill(0)),
  currentTetromino: [],
  tetrominoPosition: { x: 4, y: 0 },
  // Trivia game state
  triviaQuestions: [],
  currentQuestionIndex: 0,
  selectedAnswerIndex: null,
  correctAnswers: 0,
  // Game progress tracking
  progress: {
    snake: {
      highScore: 0,
      gamesPlayed: 0,
    },
    tetris: {
      highScore: 0,
      gamesPlayed: 0,
    },
    trivia: {
      highScore: 0,
      gamesPlayed: 0,
      correctAnswers: 0,
    },
  },
  // Daily rewards
  lastRewardClaim: null,
};

// Define game context type
interface GameContextType {
  gameState: GameState;
  startGame: (gameType: GameType) => void;
  endGameSession: (score: number) => Promise<void>;
  resetGame: () => void;
  // Snake game actions
  moveSnake: () => void;
  handleSnakeDirection: (direction: Direction) => void;
  updateSnakeScore: (score: number) => void;
  // Tetris game actions
  rotateTetromino: () => void;
  moveTetrominoLeft: () => void;
  moveTetrominoRight: () => void;
  dropTetromino: () => void;
  updateTetrisScore: (score: number) => void;
  // Trivia game actions
  loadTriviaQuestions: () => Promise<void>;
  answerTriviaQuestion: (answerIndex: number) => void;
  nextTriviaQuestion: () => void;
  updateTriviaScore: (score: number) => void;
  // Scoring and rewards
  awardCoins: (amount: number) => Promise<void>;
  // Daily rewards
  hasDailyRewardAvailable: () => boolean;
  claimDailyReward: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const { user, addCoins } = useAuth(); // Changed from updateCoins to addCoins
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Game session management
  const startGame = (gameType: GameType) => {
    setGameState((prev) => ({
      ...prev,
      gameType,
      isPlaying: true,
      score: 0,
      level: 1,
      currentQuestionIndex: 0,
      correctAnswers: 0,
      selectedAnswerIndex: null,
    }));
  };

  const endGameSession = async (score: number) => {
    setGameState((prev) => ({ ...prev, isPlaying: false }));
    
    toast({
      title: t('game.gameOver'),
      description: t('game.finalScore', { score })
    });

    const coinsAwarded = Math.round(score / 10);
    if (user) {
      await awardCoins(coinsAwarded);
    }
    navigate('/earn');
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  // Snake game logic
  const moveSnake = () => {
    setGameState((prev) => {
      if (!prev.isPlaying || prev.gameType !== 'snake') return prev;

      const newPosition = {
        x: prev.snakePosition[0].x,
        y: prev.snakePosition[0].y,
      };

      switch (prev.snakeDirection) {
        case 'UP':
          newPosition.y -= 1;
          break;
        case 'DOWN':
          newPosition.y += 1;
          break;
        case 'LEFT':
          newPosition.x -= 1;
          break;
        case 'RIGHT':
          newPosition.x += 1;
          break;
      }

      // Basic collision detection (with walls)
      if (newPosition.x < 0 || newPosition.x > 19 || newPosition.y < 0 || newPosition.y > 19) {
        endGameSession(prev.score);
        return prev;
      }

      const newSnakePosition = [newPosition, ...prev.snakePosition];
      newSnakePosition.pop(); // Remove the tail

      return { ...prev, snakePosition: newSnakePosition };
    });
  };

  const handleSnakeDirection = (direction: Direction) => {
    setGameState((prev) => ({ ...prev, snakeDirection: direction }));
  };

  const updateSnakeScore = (score: number) => {
    setGameState((prev) => {
      const isHighScore = score > prev.progress.snake.highScore;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          snake: {
            highScore: isHighScore ? score : prev.progress.snake.highScore,
            gamesPlayed: prev.progress.snake.gamesPlayed + 1,
          }
        }
      };
    });
    
    // Save to database if user is logged in
    if (user) {
      saveGameScore('snake', score);
    }
  };

  // Tetris game logic
  const rotateTetromino = () => {
    // Implement Tetris rotation logic here
  };

  const moveTetrominoLeft = () => {
    // Implement Tetris move left logic here
  };

  const moveTetrominoRight = () => {
    // Implement Tetris move right logic here
  };

  const dropTetromino = () => {
    // Implement Tetris drop logic here
  };

  const updateTetrisScore = (score: number) => {
    setGameState((prev) => {
      const isHighScore = score > prev.progress.tetris.highScore;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          tetris: {
            highScore: isHighScore ? score : prev.progress.tetris.highScore,
            gamesPlayed: prev.progress.tetris.gamesPlayed + 1,
          }
        }
      };
    });
    
    // Save to database if user is logged in
    if (user) {
      saveGameScore('tetris', score);
    }
  };

  // Trivia game logic
  const loadTriviaQuestions = async () => {
    try {
      // Changed from trivia_questions to using a mock or another table that exists
      // For now let's use mock data since trivia_questions table doesn't exist
      const mockQuestions = [
        {
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct_answer: 2,
        },
        {
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correct_answer: 1,
        },
        {
          question: 'Who wrote "Romeo and Juliet"?',
          options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
          correct_answer: 1,
        }
      ];
      
      setGameState((prev) => ({ ...prev, triviaQuestions: mockQuestions }));
      
      toast({
        title: t('game.questionsLoaded'),
        description: t('game.startPlaying')
      });
    } catch (error: any) {
      console.error('Failed to load trivia questions:', error);
      toast({
        title: t('game.errorLoadingQuestions'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const answerTriviaQuestion = (answerIndex: number) => {
    setGameState((prev) => {
      if (prev.selectedAnswerIndex !== null) return prev;

      const isCorrect = prev.triviaQuestions[prev.currentQuestionIndex].correct_answer === answerIndex;
      let newScore = prev.score;
      let newCorrectAnswers = prev.correctAnswers;

      if (isCorrect) {
        newScore += 100;
        newCorrectAnswers += 1;
      }

      return {
        ...prev,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        selectedAnswerIndex: answerIndex,
      };
    });
  };

  const nextTriviaQuestion = () => {
    setGameState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex < prev.triviaQuestions.length) {
        return {
          ...prev,
          currentQuestionIndex: nextIndex,
          selectedAnswerIndex: null,
        };
      } else {
        endGameSession(prev.score);
        return prev;
      }
    });
  };

  const updateTriviaScore = (score: number) => {
    setGameState((prev) => {
      const isHighScore = score > prev.progress.trivia.highScore;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          trivia: {
            highScore: isHighScore ? score : prev.progress.trivia.highScore,
            gamesPlayed: prev.progress.trivia.gamesPlayed + 1,
            correctAnswers: prev.progress.trivia.correctAnswers + prev.correctAnswers,
          }
        }
      };
    });
    
    // Save to database if user is logged in
    if (user) {
      saveGameScore('trivia', score);
    }
  };

  // Scoring and rewards
  const awardCoins = async (amount: number) => {
    if (!user) return;

    try {
      await addCoins(amount);

      toast({
        title: t('game.coinsAwarded'),
        description: t('game.youWon', { amount })
      });
    } catch (error: any) {
      console.error('Error awarding coins:', error);
      toast({
        title: t('game.errorAwardingCoins'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Save game scores to database
  const saveGameScore = async (gameType: GameType, score: number) => {
    if (!user) return;
    
    try {
      await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score: score
        });
    } catch (error) {
      console.error(`Error saving ${gameType} score:`, error);
    }
  };

  // Daily rewards
  const hasDailyRewardAvailable = () => {
    const now = new Date();
    const lastReward = gameState.lastRewardClaim;
    
    // If never claimed or claimed more than 24 hours ago
    if (!lastReward) return true;
    
    const timeDiff = now.getTime() - lastReward.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  };

  const claimDailyReward = () => {
    if (!hasDailyRewardAvailable()) return false;
    
    // Set last claim time to now
    setGameState(prev => ({
      ...prev,
      lastRewardClaim: new Date()
    }));
    
    // Award coins
    if (user) {
      awardCoins(25);
      
      // Record daily reward claim in database
      try {
        supabase
          .from('daily_rewards')
          .insert({
            user_id: user.id,
            coins_rewarded: 25
          });
      } catch (error) {
        console.error('Error recording daily reward:', error);
      }
    }
    
    return true;
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        endGameSession,
        resetGame,
        moveSnake,
        handleSnakeDirection,
        updateSnakeScore,
        rotateTetromino,
        moveTetrominoLeft,
        moveTetrominoRight,
        dropTetromino,
        updateTetrisScore,
        loadTriviaQuestions,
        answerTriviaQuestion,
        nextTriviaQuestion,
        updateTriviaScore,
        awardCoins,
        hasDailyRewardAvailable,
        claimDailyReward,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
