
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pause, Play, RotateCcw, Trophy } from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

interface SnakeGameProps {
  onGameEnd?: (score: number) => void;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const INITIAL_FOOD = { x: 15, y: 15 };

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Move head based on current direction
      switch (directionRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        const finalScore = (currentSnake.length - 1) * 10;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('snake-high-score', finalScore.toString());
        }
        onGameEnd?.(finalScore);
        return currentSnake;
      }

      // Check self collision
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        const finalScore = (currentSnake.length - 1) * 10;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('snake-high-score', finalScore.toString());
        }
        onGameEnd?.(finalScore);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, onGameEnd, highScore]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      const speed = Math.max(50, 200 - Math.floor(score / 100) * 10);
      gameLoopRef.current = setTimeout(moveSnake, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, gameOver, moveSnake, score]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;

      const key = e.key;
      const currentDirection = directionRef.current;

      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDirection !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDirection !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDirection !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDirection !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, gameOver]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

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
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw snake with gradient and better styling
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      if (index === 0) {
        // Snake head with eyes
        const headGradient = ctx.createRadialGradient(
          x + cellSize/2, y + cellSize/2, 0,
          x + cellSize/2, y + cellSize/2, cellSize/2
        );
        headGradient.addColorStop(0, '#22c55e');
        headGradient.addColorStop(1, '#16a34a');
        
        ctx.fillStyle = headGradient;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        const eyeSize = cellSize * 0.15;
        ctx.fillRect(x + cellSize * 0.25, y + cellSize * 0.25, eyeSize, eyeSize);
        ctx.fillRect(x + cellSize * 0.6, y + cellSize * 0.25, eyeSize, eyeSize);
        
        // Eye pupils
        ctx.fillStyle = '#000000';
        const pupilSize = eyeSize * 0.6;
        ctx.fillRect(x + cellSize * 0.25 + eyeSize * 0.2, y + cellSize * 0.25 + eyeSize * 0.2, pupilSize, pupilSize);
        ctx.fillRect(x + cellSize * 0.6 + eyeSize * 0.2, y + cellSize * 0.25 + eyeSize * 0.2, pupilSize, pupilSize);
      } else {
        // Snake body with gradient
        const bodyGradient = ctx.createRadialGradient(
          x + cellSize/2, y + cellSize/2, 0,
          x + cellSize/2, y + cellSize/2, cellSize/2
        );
        const intensity = Math.max(0.3, 1 - index * 0.1);
        bodyGradient.addColorStop(0, `rgba(34, 197, 94, ${intensity})`);
        bodyGradient.addColorStop(1, `rgba(22, 163, 74, ${intensity})`);
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        
        // Add scales pattern
        ctx.fillStyle = `rgba(16, 185, 129, ${intensity * 0.5})`;
        ctx.fillRect(x + cellSize * 0.3, y + cellSize * 0.3, cellSize * 0.4, cellSize * 0.4);
      }
    });

    // Draw food as an apple
    const foodX = food.x * cellSize;
    const foodY = food.y * cellSize;
    
    // Apple body
    const appleGradient = ctx.createRadialGradient(
      foodX + cellSize/2, foodY + cellSize/2, 0,
      foodX + cellSize/2, foodY + cellSize/2, cellSize/2
    );
    appleGradient.addColorStop(0, '#fbbf24');
    appleGradient.addColorStop(0.7, '#f59e0b');
    appleGradient.addColorStop(1, '#d97706');
    
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    ctx.arc(foodX + cellSize/2, foodY + cellSize/2, cellSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple highlight
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(foodX + cellSize * 0.35, foodY + cellSize * 0.35, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple stem
    ctx.fillStyle = '#065f46';
    ctx.fillRect(foodX + cellSize/2 - 1, foodY + cellSize * 0.1, 2, cellSize * 0.2);

  }, [snake, food]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-8 text-lg font-semibold">
        <div className="flex items-center gap-2">
          <span>Score: {score}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-600">
          <Trophy className="h-5 w-5" />
          <span>Best: {highScore}</span>
        </div>
      </div>
      
      <Card className="p-4 bg-slate-900 border-slate-700">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-slate-600 rounded-lg shadow-2xl"
        />
      </Card>

      <div className="flex gap-4">
        {!isPlaying ? (
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
        ) : (
          <Button onClick={togglePause} variant="outline" className="flex items-center gap-2">
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
        
        <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {gameOver && (
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-red-500">Game Over!</h3>
          <p className="text-muted-foreground">Final Score: {score}</p>
          {score === highScore && score > 0 && (
            <p className="text-yellow-500 font-semibold">🎉 New High Score! 🎉</p>
          )}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Use arrow keys or WASD to move</p>
        <p>Press spacebar to pause</p>
        <p>Eat the golden apples to grow and score points!</p>
      </div>
    </div>
  );
};

export default SnakeGame;
