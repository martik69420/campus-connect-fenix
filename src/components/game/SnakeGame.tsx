
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RefreshCw, Pause } from "lucide-react";

type SnakeGameProps = {
  onGameEnd: (score: number) => Promise<void>;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 100;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  
  const directionRef = useRef(direction);
  const gameOverRef = useRef(gameOver);
  const gamePausedRef = useRef(gamePaused);
  
  // Update refs when state changes
  useEffect(() => {
    directionRef.current = direction;
    gameOverRef.current = gameOver;
    gamePausedRef.current = gamePaused;
  }, [direction, gameOver, gamePaused]);
  
  // Generate random food position
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    
    // Make sure food doesn't appear on the snake
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      return generateFood();
    }
    
    return newFood;
  }, [snake]);
  
  // Initialize the game
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection("RIGHT");
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setGamePaused(false);
  };
  
  // Handle game over
  const handleGameOver = useCallback(async () => {
    setGameOver(true);
    setGameStarted(false);
    await onGameEnd(score);
  }, [onGameEnd, score]);
  
  // Move the snake
  const moveSnake = useCallback(() => {
    if (gameOverRef.current || gamePausedRef.current) return;
    
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }
      
      // Check if snake hits the wall
      if (
        head.x < 0 || 
        head.x >= GRID_SIZE || 
        head.y < 0 || 
        head.y >= GRID_SIZE
      ) {
        if (!gameOverRef.current) {
          handleGameOver();
        }
        return prevSnake;
      }
      
      // Check if snake hits itself
      if (
        prevSnake.some((segment, index) => 
          index !== 0 && segment.x === head.x && segment.y === head.y
        )
      ) {
        if (!gameOverRef.current) {
          handleGameOver();
        }
        return prevSnake;
      }
      
      const newSnake = [head, ...prevSnake];
      
      // Check if snake eats food
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
      } else {
        newSnake.pop(); // Remove the tail if no food was eaten
      }
      
      return newSnake;
    });
  }, [food, generateFood, handleGameOver]);
  
  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const gameInterval = setInterval(() => {
      if (!gamePaused) {
        moveSnake();
      }
    }, GAME_SPEED);
    
    return () => clearInterval(gameInterval);
  }, [gameOver, gameStarted, gamePaused, moveSnake]);
  
  // Draw game elements
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw snake
    ctx.fillStyle = "#10b981"; // green for snake
    snake.forEach((segment, index) => {
      // Head is slightly different color
      if (index === 0) {
        ctx.fillStyle = "#059669";
      } else {
        ctx.fillStyle = "#10b981";
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      
      // Add a border to make segments distinct
      ctx.strokeStyle = "#f1f5f9";
      ctx.strokeRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });
    
    // Draw food
    ctx.fillStyle = "#ef4444"; // red for food
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    // Add a little shine to the food
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 3,
      food.y * CELL_SIZE + CELL_SIZE / 3,
      CELL_SIZE / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    // Draw grid (optional)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [snake, food]);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current !== "DOWN") {
            setDirection("UP");
          }
          break;
        case "ArrowDown":
          if (directionRef.current !== "UP") {
            setDirection("DOWN");
          }
          break;
        case "ArrowLeft":
          if (directionRef.current !== "RIGHT") {
            setDirection("LEFT");
          }
          break;
        case "ArrowRight":
          if (directionRef.current !== "LEFT") {
            setDirection("RIGHT");
          }
          break;
        case " ": // Space key to pause/resume
          setGamePaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, gameStarted]);
  
  // Handle direction button clicks
  const handleDirectionClick = (newDirection: Direction) => {
    if (!gameStarted || gameOver) return;
    
    switch (newDirection) {
      case "UP":
        if (directionRef.current !== "DOWN") {
          setDirection("UP");
        }
        break;
      case "DOWN":
        if (directionRef.current !== "UP") {
          setDirection("DOWN");
        }
        break;
      case "LEFT":
        if (directionRef.current !== "RIGHT") {
          setDirection("LEFT");
        }
        break;
      case "RIGHT":
        if (directionRef.current !== "LEFT") {
          setDirection("RIGHT");
        }
        break;
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-2xl font-bold">Score: {score}</div>
      
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-gray-300 rounded-md"
        />
        
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-bold mb-4">Snake Game</h3>
              <p className="mb-4">Use arrow keys or buttons to control the snake.<br />Collect food to grow and earn points!</p>
              <Button onClick={startGame} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Game
              </Button>
            </motion.div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-bold mb-2">Game Over!</h3>
              <p className="text-2xl font-bold mb-4">Your Score: {score}</p>
              <Button onClick={startGame} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Game controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-start-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionClick("UP")}
            disabled={!gameStarted || gameOver}
          >
            <ArrowUp />
          </Button>
        </div>
        <div className="col-start-1 row-start-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionClick("LEFT")}
            disabled={!gameStarted || gameOver}
          >
            <ArrowLeft />
          </Button>
        </div>
        <div className="col-start-2 row-start-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setGamePaused(!gamePaused)}
            disabled={!gameStarted || gameOver}
          >
            {gamePaused ? <Play /> : <Pause />}
          </Button>
        </div>
        <div className="col-start-3 row-start-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionClick("RIGHT")}
            disabled={!gameStarted || gameOver}
          >
            <ArrowRight />
          </Button>
        </div>
        <div className="col-start-2 row-start-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionClick("DOWN")}
            disabled={!gameStarted || gameOver}
          >
            <ArrowDown />
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        <p>Tips: Use keyboard arrow keys for better control.<br />Press Space to pause/resume the game.</p>
      </div>
    </div>
  );
};

export default SnakeGame;
