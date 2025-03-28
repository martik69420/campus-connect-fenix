import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw } from 'lucide-react';

// Define the shape of a Tetris piece
type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface Piece {
  type: PieceType;
  shape: number[][];
  position: { x: number; y: number };
  color: string;
}

// Define the colors for each piece type
const COLORS = {
  I: 'bg-cyan-500 border-cyan-600',
  O: 'bg-yellow-400 border-yellow-500',
  T: 'bg-purple-500 border-purple-600',
  S: 'bg-green-500 border-green-600',
  Z: 'bg-red-500 border-red-600',
  J: 'bg-blue-500 border-blue-600',
  L: 'bg-orange-500 border-orange-600',
  empty: 'bg-gray-100 dark:bg-gray-800',
};

// Define the shapes for each piece type
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// Board dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Create an empty board
const createEmptyBoard = () => 
  Array.from({ length: BOARD_HEIGHT }, () => 
    Array.from({ length: BOARD_WIDTH }, () => null)
  );

// Component for a single cell
const Cell: React.FC<{ color: string | null, size: number }> = ({ color, size }) => (
  <div
    className={`${color || COLORS.empty} border transition-colors`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
    }}
  />
);

// Main Tetris game component
const TetrisGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const { t } = useLanguage();
  const { user, addCoins } = useAuth();
  const { toast } = useToast();
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [cellSize, setCellSize] = useState(25);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const dropTimeRef = useRef<number>(1000);
  
  // Responsive cell size
  useEffect(() => {
    const updateCellSize = () => {
      if (gameAreaRef.current) {
        const containerWidth = gameAreaRef.current.clientWidth;
        // Maximum of 30px and minimum of 15px per cell
        const newCellSize = Math.min(Math.max(Math.floor(containerWidth / BOARD_WIDTH), 15), 30);
        setCellSize(newCellSize);
      }
    };
    
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  // Create a new random piece
  const createRandomPiece = useCallback(() => {
    const pieceTypes: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    
    return {
      type: randomType,
      shape: SHAPES[randomType],
      position: { 
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[randomType][0].length / 2), 
        y: 0 
      },
      color: COLORS[randomType],
    };
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    
    const newPiece = createRandomPiece();
    const nextNewPiece = createRandomPiece();
    
    setCurrentPiece(newPiece);
    setNextPiece(nextNewPiece);
    
    lastTimeRef.current = 0;
    dropTimeRef.current = 1000;
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [createRandomPiece]);

  // Reset the game
  const resetGame = useCallback(() => {
    if (gameOver && score > 0) {
      saveScore();
    }
    startGame();
  }, [gameOver, score, startGame]);

  // Save score to database
  const saveScore = useCallback(async () => {
    if (!user || score <= 0) return;
    
    try {
      // Save score to game history
      await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: 'tetris',
          score: score,
        });
        
      // Reward coins based on score
      const coinsEarned = Math.floor(score / 100);
      if (coinsEarned > 0 && addCoins) {
        addCoins(coinsEarned, 'Tetris game reward');
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }, [user, score, addCoins]);

  // Check if the current position is valid
  const isValidPosition = useCallback((piece: Piece, boardToCheck: (string | null)[][]) => {
    return piece.shape.every((row, y) =>
      row.every((cell, x) => {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        
        // Check if the piece is within the board bounds
        const isWithinBounds = 
          boardX >= 0 && 
          boardX < BOARD_WIDTH && 
          boardY >= 0 && 
          boardY < BOARD_HEIGHT;
        
        // If cell is empty (0) or outside bounds, it's valid
        if (!cell || !isWithinBounds) return true;
        
        // If there's already a piece at this position, it's invalid
        return !boardToCheck[boardY][boardX];
      })
    );
  }, []);

  // Move the current piece
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPosition = { ...currentPiece.position };
    
    if (direction === 'left') newPosition.x -= 1;
    if (direction === 'right') newPosition.x += 1;
    if (direction === 'down') newPosition.y += 1;
    
    const newPiece = {
      ...currentPiece,
      position: newPosition,
    };
    
    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
      return true;
    }
    
    // If we couldn't move down, we've hit something
    if (direction === 'down') {
      // Place the piece on the board
      placePiece();
      return false;
    }
    
    return false;
  }, [currentPiece, gameOver, isPaused, board, isValidPosition]);

  // Rotate the current piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    // Matrix rotation algorithm (transpose and reverse rows)
    const rotatedShape = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map(row => row[index]).reverse()
    );
    
    const newPiece = {
      ...currentPiece,
      shape: rotatedShape,
    };
    
    // Try the rotation, if it doesn't work, try wall kicks
    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      // Wall kick attempts (try shifting left, right, or up)
      const kicks = [
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 },  // Right
        { x: 0, y: -1 }, // Up
        { x: -2, y: 0 }, // Far left
        { x: 2, y: 0 },  // Far right
      ];
      
      for (const kick of kicks) {
        const kickedPiece = {
          ...newPiece,
          position: {
            x: newPiece.position.x + kick.x,
            y: newPiece.position.y + kick.y,
          },
        };
        
        if (isValidPosition(kickedPiece, board)) {
          setCurrentPiece(kickedPiece);
          break;
        }
      }
    }
  }, [currentPiece, gameOver, isPaused, board, isValidPosition]);

  // Hard drop the current piece
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let newY = currentPiece.position.y;
    
    // Keep moving down until we hit something
    while (true) {
      newY += 1;
      
      const testPiece = {
        ...currentPiece,
        position: { ...currentPiece.position, y: newY },
      };
      
      if (!isValidPosition(testPiece, board)) {
        // We've gone too far, go back one step
        newY -= 1;
        break;
      }
    }
    
    // Set the piece at the lowest valid position
    setCurrentPiece({
      ...currentPiece,
      position: { ...currentPiece.position, y: newY },
    });
    
    // Place the piece
    placePiece();
  }, [currentPiece, gameOver, isPaused, board, isValidPosition]);

  // Place the current piece on the board
  const placePiece = useCallback(() => {
    if (!currentPiece || !nextPiece) return;
    
    // Create a new board with the current piece placed
    const newBoard = [...board];
    
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          
          // Ensure we're within the board boundaries
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });
    
    // Check if the piece placement is at the top of the board
    const isGameOver = currentPiece.position.y <= 0;
    
    if (isGameOver) {
      setGameOver(true);
      if (score > 0) {
        saveScore();
      }
      return;
    }
    
    // Check for completed lines
    const completedLines = checkForCompletedLines(newBoard);
    
    // Update score
    if (completedLines > 0) {
      const newScore = score + calculateScore(completedLines, level);
      const newLines = lines + completedLines;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      setScore(newScore);
      setLines(newLines);
      setLevel(newLevel);
      dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
      
      if (onScoreUpdate) {
        onScoreUpdate(newScore);
      }
    }
    
    // Set the new board
    setBoard(newBoard);
    
    // Set the next piece as the current piece and generate a new next piece
    setCurrentPiece(nextPiece);
    setNextPiece(createRandomPiece());
  }, [currentPiece, nextPiece, board, level, lines, score, createRandomPiece, saveScore, onScoreUpdate]);

  // Check for completed lines
  const checkForCompletedLines = useCallback((board: (string | null)[][]) => {
    let completedLines = 0;
    
    // Check each row from bottom to top
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      // Check if the row is completely filled
      const isRowComplete = board[y].every(cell => cell !== null);
      
      if (isRowComplete) {
        completedLines += 1;
        
        // Remove the completed row and add a new empty row at the top
        board.splice(y, 1);
        board.unshift(Array(BOARD_WIDTH).fill(null));
        
        // We need to recheck this row since we moved a new row down
        y += 1;
      }
    }
    
    return completedLines;
  }, []);

  // Calculate score based on completed lines and level
  const calculateScore = useCallback((completedLines: number, level: number) => {
    // Standard scoring system similar to classic Tetris
    const basePoints = [0, 40, 100, 300, 1200];
    return basePoints[completedLines] * level;
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameStarted || gameOver || isPaused) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Calculate time since last drop
    const deltaTime = timestamp - lastTimeRef.current;
    
    // If enough time has passed, move the piece down
    if (deltaTime > dropTimeRef.current) {
      lastTimeRef.current = timestamp;
      movePiece('down');
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, isPaused, movePiece]);

  // Update the board with the current piece without placing it
  const getBoardWithCurrentPiece = useCallback(() => {
    if (!currentPiece) return board;
    
    // Create a deep copy of the board
    const newBoard = board.map(row => [...row]);
    
    // Add the current piece to the board
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          
          // Ensure we're within the board boundaries
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });
    
    return newBoard;
  }, [board, currentPiece]);

  // Get the next piece board
  const getNextPieceBoard = useCallback(() => {
    if (!nextPiece) return Array.from({ length: 4 }, () => Array(4).fill(null));
    
    // Create an empty board
    const previewBoard = Array.from({ length: 4 }, () => Array(4).fill(null));
    
    // Calculate the offset to center the piece
    const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
    const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);
    
    // Add the next piece to the board
    nextPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          previewBoard[y + offsetY][x + offsetX] = nextPiece.color;
        }
      });
    });
    
    return previewBoard;
  }, [nextPiece]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ': // Space bar
          hardDrop();
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, movePiece, rotatePiece, hardDrop, togglePause]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Render the board with the current piece
  const boardWithCurrentPiece = getBoardWithCurrentPiece();
  const nextPieceBoard = getNextPieceBoard();

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">{t('games.tetris')}</CardTitle>
        <CardDescription className="text-center">{t('games.tetrisDesc')}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        <div className="flex flex-col md:flex-row gap-4 mb-4 w-full justify-center">
          <div className="flex flex-col gap-2">
            <div className="text-center font-semibold">{t('games.score')}</div>
            <div className="text-2xl text-center font-bold">{score}</div>
            
            <div className="text-center font-semibold mt-2">{t('games.level')}</div>
            <div className="text-xl text-center">{level}</div>
            
            <div className="text-center font-semibold mt-2">{t('games.lines')}</div>
            <div className="text-xl text-center">{lines}</div>
            
            <div className="mt-2">
              <div className="text-center font-semibold mb-1">{t('games.next')}</div>
              <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-1">
                {nextPieceBoard.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => (
                      <Cell key={`${x}-${y}`} color={cell} size={cellSize / 1.5} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div 
            ref={gameAreaRef}
            className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            {boardWithCurrentPiece.map((row, y) => (
              <div key={y} className="flex">
                {row.map((cell, x) => (
                  <Cell key={`${x}-${y}`} color={cell} size={cellSize} />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {gameOver && (
          <div className="text-center mb-4">
            <div className="text-xl font-bold text-red-500 mb-2">{t('games.gameOver')}</div>
            <div className="mb-2">{t('games.finalScore')}: <span className="font-bold">{score}</span></div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center space-x-4">
        {!gameStarted ? (
          <Button onClick={startGame} className="px-8">
            <Play className="mr-2 h-4 w-4" />
            {t('games.play')}
          </Button>
        ) : (
          <>
            {gameOver ? (
              <Button onClick={resetGame}>
                <RotateCw className="mr-2 h-4 w-4" />
                {t('games.restart')}
              </Button>
            ) : (
              <Button onClick={togglePause}>
                {isPaused ? (
                  <Play className="mr-2 h-4 w-4" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                {isPaused ? t('games.resume') : t('games.pause')}
              </Button>
            )}
          </>
        )}
      </CardFooter>
      
      {gameStarted && !gameOver && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <p>{t('games.controls')}: {t('games.arrowKeys')}</p>
          <p>{t('games.space')}: {t('games.hardDrop')}</p>
          <p>{t('games.pKey')}: {t('games.pauseGame')}</p>
        </div>
      )}
    </Card>
  );
};

export default TetrisGame;
