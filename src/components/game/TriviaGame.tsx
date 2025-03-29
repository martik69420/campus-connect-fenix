
import React, { useState, useEffect } from "react";
import { Award, Timer, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGame } from "@/context/GameContext";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { TriviaGameProps } from "./TriviaGameTypes";

// Sample trivia questions
const TRIVIA_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars"
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare"
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean"
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Gd", "Gl", "Go", "Au"],
    correctAnswer: "Au"
  }
];

const TriviaGame: React.FC<TriviaGameProps> = ({ onGameEnd }) => {
  const { gameState, updateTriviaScore } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(15);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setGameFinished(false);
  };
  
  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer || showAnswer) return;
    
    setSelectedAnswer(answer);
    setShowAnswer(true);
    
    if (answer === TRIVIA_QUESTIONS[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 10);
      toast({
        title: "Correct!",
        description: `+10 points`,
      });
    }
  };
  
  // Move to next question or finish game
  const nextQuestion = () => {
    if (currentQuestionIndex < TRIVIA_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(15);
    } else {
      endGame();
    }
  };
  
  // End the game and update score
  const endGame = async () => {
    setGameFinished(true);
    updateTriviaScore(score);
    await onGameEnd(score);
  };
  
  // Timer for each question
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && !showAnswer && !gameFinished) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setShowAnswer(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, showAnswer, gameFinished, currentQuestionIndex]);
  
  // Current question
  const currentQuestion = TRIVIA_QUESTIONS[currentQuestionIndex];
  
  // Game progress
  const gameProgress = ((currentQuestionIndex + 1) / TRIVIA_QUESTIONS.length) * 100;

  // References to game progress
  const triviaProgress = gameState.progress.trivia;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Award className="h-5 w-5 text-fenix" />
          Campus Trivia
        </CardTitle>
        <CardDescription>
          Test your knowledge and earn coins!
        </CardDescription>
      </CardHeader>
      
      <AnimatePresence mode="wait">
        {!gameStarted && !gameFinished && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="text-center py-6">
              <div className="flex flex-col items-center mb-4">
                <Award className="h-16 w-16 text-fenix mb-4" />
                <h3 className="text-xl font-semibold">Welcome to Campus Trivia!</h3>
                <p className="text-muted-foreground mt-2">
                  Answer questions correctly to earn coins. You have 15 seconds per question.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{triviaProgress.gamesPlayed}</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{triviaProgress.highScore}</div>
                  <div className="text-sm text-muted-foreground">High Score</div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={startGame} className="px-8">
                Start Game
              </Button>
            </CardFooter>
          </motion.div>
        )}
        
        {gameStarted && !gameFinished && (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pb-6">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="outline" className="font-normal">
                  Question {currentQuestionIndex + 1}/{TRIVIA_QUESTIONS.length}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Timer className={`h-4 w-4 ${timeLeft < 5 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span className={`${timeLeft < 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
              
              <Progress value={gameProgress} className="mb-6" />
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
                
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      className={`justify-start h-auto py-3 px-4 text-left ${
                        showAnswer && option === currentQuestion.correctAnswer
                          ? 'bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/10'
                          : showAnswer && option === selectedAnswer && option !== currentQuestion.correctAnswer
                          ? 'bg-destructive/10 border-destructive text-destructive hover:bg-destructive/10'
                          : selectedAnswer === option
                          ? 'border-primary/50 bg-primary/5'
                          : ''
                      }`}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={showAnswer || selectedAnswer !== null}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Score: </span>
                  <span>{score}</span>
                </div>
                
                {showAnswer && (
                  <Button onClick={nextQuestion} className="flex items-center gap-1">
                    {currentQuestionIndex < TRIVIA_QUESTIONS.length - 1 ? 'Next' : 'Finish'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
        
        {gameFinished && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="text-center py-6">
              <div className="flex flex-col items-center mb-6">
                <Award className="h-16 w-16 text-fenix mb-4" />
                <h3 className="text-xl font-semibold">Game Completed!</h3>
                <p className="text-muted-foreground mt-2">
                  You've earned coins based on your performance.
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                
                {score > triviaProgress.highScore && (
                  <Badge className="mt-2 bg-fenix text-white">New High Score!</Badge>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-semibold">{Math.max(triviaProgress.highScore, score)}</div>
                  <div className="text-sm text-muted-foreground">High Score</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-xl font-semibold">{triviaProgress.gamesPlayed + 1}</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={startGame} className="px-8">
                Play Again
              </Button>
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default TriviaGame;
