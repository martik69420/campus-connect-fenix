
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TriviaGameProps {
  onGameEnd: (score: number, totalQuestions: number) => void;
}

const TriviaGame: React.FC<TriviaGameProps> = ({ onGameEnd }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const { toast } = useToast();
  
  // Load trivia questions
  useEffect(() => {
    const mockQuestions: TriviaQuestion[] = [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2 // Paris (index 2)
      },
      {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Jupiter", "Mars", "Saturn"],
        correctAnswer: 1 // Jupiter (index 1)
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: 1 // William Shakespeare (index 1)
      },
      {
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctAnswer: 2 // Au (index 2)
      },
      {
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2 // 1945 (index 2)
      }
    ];
    
    setQuestions(mockQuestions);
    setLoading(false);
  }, []);
  
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(prevScore => prevScore + 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Game completed
      setGameCompleted(true);
      onGameEnd(score + (selectedOption === questions[currentQuestionIndex]?.correctAnswer ? 1 : 0), questions.length);
    }
  };
  
  const handleRestartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setGameCompleted(false);
    
    // Shuffle questions for a new game
    setQuestions(prevQuestions => [...prevQuestions].sort(() => Math.random() - 0.5));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (gameCompleted) {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-bold mb-4">Game Completed!</h2>
        <p className="text-lg mb-6">
          Your final score: <span className="font-bold text-primary">{score}/{questions.length}</span>
        </p>
        
        <div className="mb-6">
          {score === questions.length ? (
            <p className="text-green-500 font-medium">Perfect score! Excellent job!</p>
          ) : score >= questions.length / 2 ? (
            <p className="text-primary font-medium">Good job! You did well!</p>
          ) : (
            <p className="text-muted-foreground font-medium">Better luck next time!</p>
          )}
        </div>
        
        <Button onClick={handleRestartGame}>Play Again</Button>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <p className="text-sm font-medium">
            Score: {score}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            Progress
          </p>
          <Progress 
            value={((currentQuestionIndex + (isAnswered ? 1 : 0)) / questions.length) * 100} 
            className="w-24 h-2" 
          />
        </div>
      </div>
      
      <div className="p-4 bg-muted/30 rounded-lg">
        <h2 className="text-lg font-medium mb-6">{currentQuestion.question}</h2>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              disabled={isAnswered}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isAnswered
                  ? index === currentQuestion.correctAnswer
                    ? "bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700"
                    : selectedOption === index
                    ? "bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                    : "bg-muted/50 border-border"
                  : "hover:bg-accent border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isAnswered && (
                  index === currentQuestion.correctAnswer ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : selectedOption === index ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleNextQuestion} 
          disabled={!isAnswered}
          className={!isAnswered ? "opacity-50" : ""}
        >
          {currentQuestionIndex < questions.length - 1 ? (
            <>Next Question <ArrowRight className="h-4 w-4 ml-2" /></>
          ) : (
            <>Finish Game <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TriviaGame;
