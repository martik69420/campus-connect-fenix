
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Trophy, Zap } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  onGameEnd?: (score: number) => void;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd }) => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0');
  });
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(150);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / GRID_SIZE), 0);
      ctx.lineTo(i * (canvas.width / GRID_SIZE), canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / GRID_SIZE));
      ctx.lineTo(canvas.width, i * (canvas.height / GRID_SIZE));
      ctx.stroke();
    }

    // Draw snake with gradient
    snake.forEach((segment, index) => {
      const x = segment.x * (canvas.width / GRID_SIZE);
      const y = segment.y * (canvas.height / GRID_SIZE);
      const size = canvas.width / GRID_SIZE;
      
      const snakeGradient = ctx.createRadialGradient(
        x + size/2, y + size/2, 0,
        x + size/2, y + size/2, size/2
      );
      
      if (index === 0) {
        // Head
        snakeGradient.addColorStop(0, '#22c55e');
        snakeGradient.addColorStop(1, '#16a34a');
      } else {
        // Body
        snakeGradient.addColorStop(0, '#4ade80');
        snakeGradient.addColorStop(1, '#22c55e');
      }
      
      ctx.fillStyle = snakeGradient;
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      
      // Add shine effect
      if (index === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 2, y + 2, size/3, size/3);
      }
    });

    // Draw food with pulsing effect
    const foodX = food.x * (canvas.width / GRID_SIZE);
    const foodY = food.y * (canvas.height / GRID_SIZE);
    const foodSize = canvas.width / GRID_SIZE;
    
    const time = Date.now() / 200;
    const pulse = Math.sin(time) * 0.1 + 0.9;
    
    const foodGradient = ctx.createRadialGradient(
      foodX + foodSize/2, foodY + foodSize/2, 0,
      foodX + foodSize/2, foodY + foodSize/2, foodSize/2 * pulse
    );
    foodGradient.addColorStop(0, '#ef4444');
    foodGradient.addColorStop(1, '#dc2626');
    
    ctx.fillStyle = foodGradient;
    ctx.fillRect(
      foodX + (1 - pulse) * foodSize/2, 
      foodY + (1 - pulse) * foodSize/2, 
      foodSize * pulse, 
      foodSize * pulse
    );
    
    // Add sparkle effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(foodX + foodSize/3, foodY + foodSize/4, 3, 3);
  }, [snake, food]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood());
        setSpeed(prev => Math.max(80, prev - 2)); // Increase speed slightly
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, gameStarted, generateFood, highScore]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || gameOver) return;

    switch (e.key) {
      case 'ArrowUp':
        if (direction.y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x !== -1) setDirection({ x: 1, y: 0 });
        break;
      case ' ':
        e.preventDefault();
        setIsPaused(prev => !prev);
        break;
    }
  }, [direction, gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection(INITIAL_DIRECTION);
    setSpeed(150);
    setIsPaused(false);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setSpeed(150);
    setIsPaused(false);
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, gameStarted, gameOver, isPaused, speed]);

  useEffect(() => {
    drawGame();
  }, [drawGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameOver && onGameEnd) {
      onGameEnd(score);
    }
  }, [gameOver, score, onGameEnd]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Zap className="h-4 w-4 mr-1" />
            Score: {score}
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Trophy className="h-4 w-4 mr-1" />
            Best: {highScore}
          </Badge>
        </div>
        <div className="flex gap-2">
          {!gameStarted ? (
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsPaused(!isPaused)} variant="outline">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button onClick={resetGame} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-2">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full max-w-[600px] h-auto border-0 bg-slate-900"
          />
        </CardContent>
      </Card>

      {gameOver && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
          <CardHeader className="text-center">
            <CardTitle className="text-red-700 dark:text-red-300">Game Over!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">Final Score: <strong>{score}</strong></p>
            {score === highScore && score > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                🎉 New High Score! 🎉
              </p>
            )}
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </CardContent>
        </Card>
      )}

      {isPaused && gameStarted && !gameOver && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="text-center py-4">
            <p className="text-yellow-700 dark:text-yellow-300 font-semibold">Game Paused</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Press Space or click Play to continue</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Controls:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>↑↓←→ Arrow keys to move</div>
            <div>Space to pause/resume</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnakeGame;
