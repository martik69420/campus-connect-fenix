
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { motion } from 'framer-motion';

interface SnakeGameWrapperProps {
  onGameEnd: (score: number) => void;
}

const SnakeGameWrapper: React.FC<SnakeGameWrapperProps> = ({ onGameEnd }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [direction, setDirection] = useState<string>('right');
  const [snake, setSnake] = useState<Array<{x: number, y: number}>>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<{x: number, y: number}>({ x: 5, y: 5 });
  const [speed, setSpeed] = useState<number>(150);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { addCoins } = useAuth();

  const canvasSize = 300;
  const gridSize = 20;
  const cellSize = canvasSize / gridSize;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'down') setDirection('up');
          break;
        case 'ArrowDown':
          if (direction !== 'up') setDirection('down');
          break;
        case 'ArrowLeft':
          if (direction !== 'right') setDirection('left');
          break;
        case 'ArrowRight':
          if (direction !== 'left') setDirection('right');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [direction, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const gameLoop = setInterval(updateGame, speed);
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [snake, food, gameStarted, gameOver, direction, speed]);

  useEffect(() => {
    if (canvasRef.current) {
      draw();
    }
  }, [snake, food, gameOver]);

  const updateGame = () => {
    const newSnake = [...snake];
    let head = { ...newSnake[0] };
    
    // Update head position based on direction
    switch (direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
      default:
        break;
    }
    
    // Check for collision with walls
    if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
      handleGameOver();
      return;
    }
    
    // Check for collision with self
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver();
      return;
    }
    
    // Add new head
    newSnake.unshift(head);
    
    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
      // Increase score
      setScore(prev => prev + 10);
      
      // Generate new food
      const newFood = generateFood(newSnake);
      setFood(newFood);
      
      // Increase speed slightly every 5 food items
      if (score % 50 === 0 && speed > 50) {
        setSpeed(prev => prev - 10);
      }
    } else {
      // Remove tail if no food was eaten
      newSnake.pop();
    }
    
    setSnake(newSnake);
  };

  const generateFood = (snake: Array<{x: number, y: number}>) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    return newFood;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e9ecef';
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
    
    // Draw snake
    ctx.fillStyle = '#4C1D95';
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Draw head with a different color
        ctx.fillStyle = '#6D28D9';
      } else {
        // Gradient effect for the body
        const colorValue = 150 - (index * 5 > 100 ? 100 : index * 5);
        ctx.fillStyle = `rgb(109, 40, ${colorValue + 100})`;
      }
      
      ctx.fillRect(
        segment.x * cellSize,
        segment.y * cellSize,
        cellSize,
        cellSize
      );
      
      // Add eyes to the head
      if (index === 0) {
        ctx.fillStyle = 'white';
        const eyeSize = cellSize / 5;
        
        // Position eyes based on direction
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        switch (direction) {
          case 'up':
            eyeX1 = segment.x * cellSize + cellSize / 3 - eyeSize / 2;
            eyeY1 = segment.y * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + 2 * cellSize / 3 - eyeSize / 2;
            eyeY2 = segment.y * cellSize + cellSize / 3;
            break;
          case 'down':
            eyeX1 = segment.x * cellSize + cellSize / 3 - eyeSize / 2;
            eyeY1 = segment.y * cellSize + 2 * cellSize / 3;
            eyeX2 = segment.x * cellSize + 2 * cellSize / 3 - eyeSize / 2;
            eyeY2 = segment.y * cellSize + 2 * cellSize / 3;
            break;
          case 'left':
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeY1 = segment.y * cellSize + cellSize / 3 - eyeSize / 2;
            eyeX2 = segment.x * cellSize + cellSize / 3;
            eyeY2 = segment.y * cellSize + 2 * cellSize / 3 - eyeSize / 2;
            break;
          case 'right':
            eyeX1 = segment.x * cellSize + 2 * cellSize / 3;
            eyeY1 = segment.y * cellSize + cellSize / 3 - eyeSize / 2;
            eyeX2 = segment.x * cellSize + 2 * cellSize / 3;
            eyeY2 = segment.y * cellSize + 2 * cellSize / 3 - eyeSize / 2;
            break;
          default:
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeY1 = segment.y * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + 2 * cellSize / 3;
            eyeY2 = segment.y * cellSize + cellSize / 3;
        }
        
        ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
        ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
        
        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(eyeX1 + eyeSize / 4, eyeY1 + eyeSize / 4, eyeSize / 2, eyeSize / 2);
        ctx.fillRect(eyeX2 + eyeSize / 4, eyeY2 + eyeSize / 4, eyeSize / 2, eyeSize / 2);
      }
    });
    
    // Draw food
    ctx.fillStyle = '#F87171';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    // Add a leaf to the food (apple)
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.ellipse(
      food.x * cellSize + cellSize / 2 + cellSize / 6,
      food.y * cellSize + cellSize / 4,
      cellSize / 6,
      cellSize / 4,
      Math.PI / 4,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    if (gameOver) {
      // Game over overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 10);
      
      ctx.font = '18px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
    
    if (!gameStarted && !gameOver) {
      // Start game overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press Start to play', canvas.width / 2, canvas.height / 2);
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
    
    // Calculate points - higher score = more coins
    let coinsEarned = 0;
    if (score > 100) {
      coinsEarned = 50;
    } else if (score > 50) {
      coinsEarned = 25;
    } else if (score > 20) {
      coinsEarned = 10;
    } else {
      coinsEarned = 5;
    }
    
    if (addCoins) {
      addCoins(coinsEarned, `Snake game score: ${score}`);
    }
    
    toast({
      title: "Game Over!",
      description: `Your score: ${score}. You earned ${coinsEarned} coins!`,
    });
    
    onGameEnd(score);
  };

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection('right');
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSpeed(150);
  };

  const handleDirectionClick = (newDirection: string) => {
    if (!gameStarted || gameOver) return;
    
    // Prevent 180 degree turns
    if (
      (newDirection === 'up' && direction !== 'down') ||
      (newDirection === 'down' && direction !== 'up') ||
      (newDirection === 'left' && direction !== 'right') ||
      (newDirection === 'right' && direction !== 'left')
    ) {
      setDirection(newDirection);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="text-xl font-bold">Score: {score}</div>
        {gameOver ? (
          <Button onClick={startGame}>Play Again</Button>
        ) : !gameStarted ? (
          <Button onClick={startGame}>Start Game</Button>
        ) : (
          <Button variant="outline" onClick={() => setGameOver(true)}>End Game</Button>
        )}
      </div>
      
      <div className="relative mb-6">
        <canvas 
          ref={canvasRef} 
          width={canvasSize} 
          height={canvasSize}
          className="border border-border rounded-md shadow-md bg-background"
        />
        
        {/* Instructions overlay */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-md">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-center p-4"
            >
              <h3 className="text-xl font-bold mb-2">How to play</h3>
              <p className="mb-4">Use arrow keys to control the snake.<br/>Collect food to grow and earn points!</p>
              <Button onClick={startGame}>Start Game</Button>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Mobile controls */}
      <div className="md:hidden grid grid-cols-3 gap-2 w-[300px]">
        <div></div>
        <Button variant="outline" onClick={() => handleDirectionClick('up')}>↑</Button>
        <div></div>
        
        <Button variant="outline" onClick={() => handleDirectionClick('left')}>←</Button>
        <Button variant="outline" onClick={() => handleDirectionClick('down')}>↓</Button>
        <Button variant="outline" onClick={() => handleDirectionClick('right')}>→</Button>
      </div>
    </div>
  );
};

export default SnakeGameWrapper;
