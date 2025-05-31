import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 1, y: 0 };

const SnakeGameWrapper = () => {
  const { isAuthenticated, user, addCoins } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const getRandomPosition = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  };

  const handleGameEnd = useCallback(async (finalScore: number) => {
    if (gameEnded) return;
    
    setGameEnded(true);
    setGameRunning(false);
    
    // Save game history
    if (isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('game_history')
          .insert({
            user_id: user.id,
            game_type: 'snake',
            score: finalScore
          });

        if (error) throw error;

        // Award coins for playing
        await addCoins(finalScore);
        
        toast({
          title: "Game Over!",
          description: `You scored ${finalScore} points and earned ${finalScore} coins!`,
        });
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
  }, [gameEnded, isAuthenticated, user, addCoins]);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameRunning) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for collision with walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true);
      handleGameEnd(score);
      return;
    }

    // Check for collision with self
    if (snake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      handleGameEnd(score);
      return;
    }

    let newSnake = [head, ...snake];
    let newFood = { ...food };
    let newScore = score;

    if (head.x === food.x && head.y === food.y) {
      newFood = getRandomPosition();
      newScore += 1;
      setScore(newScore);
    } else {
      newSnake = newSnake.slice(0, -1);
    }

    setSnake(newSnake);
    setFood(newFood);
  }, [snake, food, direction, gameOver, gameRunning, score, handleGameEnd]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, 150); // Adjust speed as needed

    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the snake
    ctx.fillStyle = 'green';
    snake.forEach((segment) => {
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw the food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    }
  }, [snake, food, gameOver]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setGameRunning(true);
    setGameEnded(false);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Snake Game</h1>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border border-gray-400"
      />
      <div className="mt-4">
        <p>Score: {score}</p>
        {gameOver ? (
          <Button onClick={startGame}>Restart Game</Button>
        ) : (
          !gameRunning && <Button onClick={startGame}>Start Game</Button>
        )}
      </div>
    </div>
  );
};

export default SnakeGameWrapper;
