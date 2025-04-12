import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Timer } from 'lucide-react';

interface TriviaGameProps {
  onGameEnd: (score: number, totalQuestions: number) => void;
}

const TriviaGame: React.FC<TriviaGameProps> = ({ onGameEnd }) => {
  const [questions, setQuestions] = useState([
    { question: 'What is the capital of France?', answer: 'Paris', options: ['London', 'Paris', 'Berlin', 'Rome'] },
    { question: 'What is 2 + 2?', answer: '4', options: ['3', '4', '5', '6'] },
    { question: 'What is the largest planet in our solar system?', answer: 'Jupiter', options: ['Mars', 'Jupiter', 'Saturn', 'Neptune'] },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (!gameEnded) {
      let intervalId: NodeJS.Timeout;
      if (timer > 0 && !isTimeUp) {
        intervalId = setInterval(() => {
          setTimer(prevTimer => prevTimer - 1);
        }, 1000);
      } else if (timer === 0) {
        setIsTimeUp(true);
      }

      return () => clearInterval(intervalId);
    }
  }, [timer, isTimeUp, gameEnded]);

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestionIndex].answer) {
      setScore(prevScore => prevScore + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedAnswer(null);
      setTimer(15);
      setIsTimeUp(false);
    } else {
      setGameEnded(true);
      onGameEnd(score, questions.length);
    }
  };

  useEffect(() => {
    if (isTimeUp) {
      handleNextQuestion();
    }
  }, [isTimeUp]);

  if (gameEnded) {
    return (
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Award className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Game Over!</h2>
        <p className="text-lg text-gray-600 mb-4">
          Your Score: {score} / {questions.length}
        </p>
        <Button onClick={() => {
          setGameEnded(false);
          setCurrentQuestionIndex(0);
          setScore(0);
          setTimer(15);
          setIsTimeUp(false);
          setSelectedAnswer(null);
        }}>
          Play Again
        </Button>
      </CardContent>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1}</h2>
        <div className="flex items-center space-x-2">
          <Timer className="h-4 w-4 text-gray-500" />
          <span>{timer}s</span>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-lg">{currentQuestion.question}</p>
      <div className="grid grid-cols-2 gap-4">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === option ? 'secondary' : 'outline'}
            onClick={() => handleAnswerSelection(option)}
            disabled={selectedAnswer !== null}
          >
            {option}
          </Button>
        ))}
      </div>
      <Button onClick={handleNextQuestion} disabled={selectedAnswer === null}>
        {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
      </Button>
    </CardContent>
  );
};

export default TriviaGame;
