
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RefreshCw, Pause, Trophy, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type SnakeGameProps = {
  onGameEnd: (score: number) => Promise<void>;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };
type FoodType = "regular" | "bonus" | "special";

// Configuration
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BASE_GAME_SPEED = 120; // ms - lower is faster
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE_LENGTH = 3;
const SPEED_INCREASE_FACTOR = 0.97; // 3% faster each time
const SPEED_INCREASE_INTERVAL = 5; // After eating this many food items

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Position[]>([]);
  const [food, setFood] = useState<Position & { type: FoodType }>({ x: 5, y: 5, type: "regular" });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [currentSpeed, setCurrentSpeed] = useState(BASE_GAME_SPEED);
  const [foodEaten, setFoodEaten] = useState(0);
  const [level, setLevel] = useState(1);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusTimeLeft, setBonusTimeLeft] = useState(0);
  
  // Refs to access latest state values in callbacks
  const directionRef = useRef(direction);
  const gameOverRef = useRef(gameOver);
  const gamePausedRef = useRef(gamePaused);
  const scoreRef = useRef(score);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const currentSpeedRef = useRef(currentSpeed);
  
  // Update refs when state changes
  useEffect(() => {
    directionRef.current = direction;
    gameOverRef.current = gameOver;
    gamePausedRef.current = gamePaused;
    scoreRef.current = score;
    snakeRef.current = snake;
    foodRef.current = food;
    currentSpeedRef.current = currentSpeed;
  }, [direction, gameOver, gamePaused, score, snake, food, currentSpeed]);
  
  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);
  
  // Generate random food position
  const generateFood = useCallback((): Position & { type: FoodType } => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      type: "regular" as FoodType
    };
    
    // Make food not appear on the snake
    const isOnSnake = snakeRef.current.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      return generateFood();
    }
    
    // Chance for bonus food based on current score
    const bonusChance = Math.min(0.2, 0.05 + (scoreRef.current / 200)); // 5-20% chance
    if (Math.random() < bonusChance) {
      newFood.type = "bonus";
    }
    
    // Rare chance for special food
    const specialChance = Math.min(0.05, 0.01 + (scoreRef.current / 500)); // 1-5% chance
    if (Math.random() < specialChance) {
      newFood.type = "special";
    }
    
    return newFood;
  }, []);
  
  // Initialize the game
  const startGame = () => {
    // Create initial snake with multiple segments
    const initialSnake: Position[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: 10 - i, y: 10 });
    }
    
    setSnake(initialSnake);
    setFood(generateFood());
    setDirection("RIGHT");
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setGamePaused(false);
    setSpeedLevel(1);
    setCurrentSpeed(BASE_GAME_SPEED);
    setFoodEaten(0);
    setLevel(1);
    setShowBonus(false);
    setBonusTimeLeft(0);
  };
  
  // Handle game over
  const handleGameOver = useCallback(async () => {
    setGameOver(true);
    setGameStarted(false);
    
    // Update high score if necessary
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem("snakeHighScore", scoreRef.current.toString());
    }
    
    await onGameEnd(scoreRef.current);
  }, [onGameEnd, highScore]);
  
  // Move the snake
  const moveSnake = useCallback(() => {
    if (gameOverRef.current || gamePausedRef.current) return;
    
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
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
      
      // Add new head
      newSnake.unshift(head);
      
      // Check if snake eats food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        // Calculate points based on food type
        let points = 10; // Base points for regular food
        
        if (foodRef.current.type === "bonus") {
          points = 25;
        } else if (foodRef.current.type === "special") {
          points = 50;
          // Special food could trigger bonus time
          setShowBonus(true);
          setBonusTimeLeft(10); // 10 seconds bonus time
        }
        
        setScore(prev => prev + points);
        setFoodEaten(prev => {
          const newFoodEaten = prev + 1;
          
          // Check if we should increase level
          if (newFoodEaten % 5 === 0) {
            setLevel(prevLevel => prevLevel + 1);
          }
          
          // Check if we should increase speed
          if (newFoodEaten % SPEED_INCREASE_INTERVAL === 0) {
            setSpeedLevel(prevLevel => prevLevel + 1);
            setCurrentSpeed(prevSpeed => prevSpeed * SPEED_INCREASE_FACTOR);
          }
          
          return newFoodEaten;
        });
        
        // Generate new food
        setFood(generateFood());
      } else {
        // Remove the tail if no food was eaten
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [generateFood, handleGameOver]);
  
  // Bonus time countdown
  useEffect(() => {
    if (!showBonus || bonusTimeLeft <= 0) return;
    
    const bonusTimer = setInterval(() => {
      setBonusTimeLeft(prev => {
        if (prev <= 1) {
          setShowBonus(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(bonusTimer);
  }, [showBonus, bonusTimeLeft]);
  
  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const gameInterval = setInterval(() => {
      if (!gamePaused) {
        moveSnake();
      }
    }, currentSpeed);
    
    return () => clearInterval(gameInterval);
  }, [gameOver, gameStarted, gamePaused, moveSnake, currentSpeed]);
  
  // Draw game elements
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid background (checkerboard pattern)
    ctx.fillStyle = showBonus ? "rgba(255, 223, 186, 0.2)" : "rgba(240, 240, 240, 0.2)";
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(
            i * CELL_SIZE,
            j * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Gradient from head to tail
      let r = 16, g = 185, b = 129; // Green base color (#10b981)
      
      if (index === 0) {
        // Head is a different color
        ctx.fillStyle = "#059669"; // Darker green
      } else {
        // Calculate gradient color based on position in snake
        const gradientFactor = index / snake.length;
        ctx.fillStyle = showBonus 
          ? `rgb(${255 - Math.floor(100 * gradientFactor)}, ${185 - Math.floor(50 * gradientFactor)}, ${50 + Math.floor(gradientFactor * 100)})`  // Orange/red in bonus mode
          : `rgb(${r - Math.floor(gradientFactor * 10)}, ${g - Math.floor(gradientFactor * 50)}, ${b - Math.floor(gradientFactor * 30)})`;
      }
      
      // Draw rounded rectangle for the snake segments
      const radius = CELL_SIZE / 5;
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const width = CELL_SIZE;
      const height = CELL_SIZE;
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      
      // Draw eyes on the head
      if (index === 0) {
        const eyeSize = CELL_SIZE / 5;
        ctx.fillStyle = "white";
        
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch (direction) {
          case "UP":
            leftEyeX = x + CELL_SIZE / 4 - eyeSize / 2;
            leftEyeY = y + CELL_SIZE / 3 - eyeSize / 2;
            rightEyeX = x + (CELL_SIZE * 3) / 4 - eyeSize / 2;
            rightEyeY = y + CELL_SIZE / 3 - eyeSize / 2;
            break;
          case "DOWN":
            leftEyeX = x + CELL_SIZE / 4 - eyeSize / 2;
            leftEyeY = y + (CELL_SIZE * 2) / 3 - eyeSize / 2;
            rightEyeX = x + (CELL_SIZE * 3) / 4 - eyeSize / 2;
            rightEyeY = y + (CELL_SIZE * 2) / 3 - eyeSize / 2;
            break;
          case "LEFT":
            leftEyeX = x + CELL_SIZE / 3 - eyeSize / 2;
            leftEyeY = y + CELL_SIZE / 4 - eyeSize / 2;
            rightEyeX = x + CELL_SIZE / 3 - eyeSize / 2;
            rightEyeY = y + (CELL_SIZE * 3) / 4 - eyeSize / 2;
            break;
          case "RIGHT":
            leftEyeX = x + (CELL_SIZE * 2) / 3 - eyeSize / 2;
            leftEyeY = y + CELL_SIZE / 4 - eyeSize / 2;
            rightEyeX = x + (CELL_SIZE * 2) / 3 - eyeSize / 2;
            rightEyeY = y + (CELL_SIZE * 3) / 4 - eyeSize / 2;
            break;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw food with animation effect
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseFactor = 1 + 0.1 * Math.sin(Date.now() / 200); // Pulsing effect
    const foodRadius = (CELL_SIZE / 2) * 0.8 * pulseFactor;
    
    // Different colors and effects based on food type
    switch (food.type) {
      case "regular":
        ctx.fillStyle = "#ef4444"; // Red
        ctx.beginPath();
        ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a stem
        ctx.fillStyle = "#65a30d";
        ctx.fillRect(foodX - 1, foodY - foodRadius - 3, 2, 3);
        break;
        
      case "bonus":
        // Draw a star
        ctx.fillStyle = "#f59e0b"; // Amber
        ctx.beginPath();
        const outerRadius = foodRadius;
        const innerRadius = foodRadius * 0.4;
        const spikes = 5;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * i) / spikes - Math.PI / 2;
          if (i === 0) {
            ctx.moveTo(foodX + radius * Math.cos(angle), foodY + radius * Math.sin(angle));
          } else {
            ctx.lineTo(foodX + radius * Math.cos(angle), foodY + radius * Math.sin(angle));
          }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add a glow effect
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
        
      case "special":
        // Rainbow colored circle
        const gradient = ctx.createRadialGradient(
          foodX, foodY, 0,
          foodX, foodY, foodRadius
        );
        gradient.addColorStop(0, "violet");
        gradient.addColorStop(0.2, "indigo");
        gradient.addColorStop(0.4, "blue");
        gradient.addColorStop(0.6, "green");
        gradient.addColorStop(0.8, "yellow");
        gradient.addColorStop(1, "red");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a glow effect
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
    }
    
    // Draw grid lines
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
  }, [snake, food, direction, showBonus]);
  
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
      <div className="flex justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-2 py-1 font-semibold">
            Level {level}
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            Speed {speedLevel}x
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{score}</span>
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="text-muted-foreground text-sm">(Best: {highScore})</span>
        </div>
      </div>
      
      {showBonus && (
        <div className="mb-2 w-full">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-amber-500 flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              Bonus Time!
            </span>
            <span className="text-sm">{bonusTimeLeft}s</span>
          </div>
          <Progress value={(bonusTimeLeft / 10) * 100} className="h-2" />
        </div>
      )}
      
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-gray-300 rounded-md shadow-md"
        />
        
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-bold mb-4">Snake Game</h3>
              <div className="mb-4 text-sm">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div></div>
                  <div className="flex justify-center items-center text-primary">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      10pts
                    </span>
                  </div>
                  <div></div>
                  <div className="flex justify-center items-center text-primary">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      25pts
                    </span>
                  </div>
                  <div className="font-semibold">Food Types</div>
                  <div className="flex justify-center items-center text-primary">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                      50pts+
                    </span>
                  </div>
                </div>
                <p>Use arrow keys or buttons to control the snake.<br />Collect food to grow and earn points!</p>
              </div>
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
              <p className="text-2xl font-bold mb-2">Your Score: {score}</p>
              {score > highScore && (
                <div className="text-yellow-500 flex items-center justify-center gap-1 mb-2">
                  <Trophy className="h-5 w-5" />
                  <span>New High Score!</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                Snake Length: {snake.length} • Level: {level} • Speed: {speedLevel}x
              </p>
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
            className="shadow-sm hover:shadow"
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
            className="shadow-sm hover:shadow"
          >
            <ArrowLeft />
          </Button>
        </div>
        <div className="col-start-2 row-start-2">
          <Button
            variant={gamePaused ? "default" : "outline"}
            size="icon"
            onClick={() => setGamePaused(!gamePaused)}
            disabled={!gameStarted || gameOver}
            className="shadow-sm hover:shadow"
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
            className="shadow-sm hover:shadow"
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
            className="shadow-sm hover:shadow"
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
