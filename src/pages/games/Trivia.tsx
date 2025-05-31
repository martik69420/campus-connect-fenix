
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton"

interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  answers: string[]; // Add this to store shuffled answers
}

const Trivia = () => {
  const { isAuthenticated, user, addCoins } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple');
        const data = await response.json();

        if (data.results) {
          // Shuffle incorrect answers and add the correct answer
          const processedQuestions = data.results.map((q: any) => {
            const answers = [...q.incorrect_answers, q.correct_answer];
            // Shuffle answers
            for (let i = answers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [answers[i], answers[j]] = [answers[j], answers[i]];
            }
            return {
              question: q.question,
              correct_answer: q.correct_answer,
              incorrect_answers: q.incorrect_answers,
              answers: answers // Store shuffled answers
            };
          });
          setQuestions(processedQuestions);
        } else {
          setError('Failed to fetch questions');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch questions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Select an answer",
        description: "Please select an answer to continue.",
      });
      return;
    }

    if (selectedAnswer === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
    }

    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleGameComplete(score);
    }
  };

  const handleGameComplete = async (finalScore: number) => {
    setGameCompleted(true);
    
    if (isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('game_history')
          .insert({
            user_id: user.id,
            game_type: 'trivia',
            score: finalScore
          });

        if (error) throw error;

        // Award coins based on score
        const coinsEarned = finalScore * 10;
        await addCoins(coinsEarned);
        
        toast({
          title: "Game Complete!",
          description: `You scored ${finalScore} points and earned ${coinsEarned} coins!`,
        });
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-24 mb-2" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-40" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-8 w-20" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (gameCompleted) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Game Over!</CardTitle>
            <CardDescription>You scored {score} out of {questions.length}!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Thanks for playing!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Trivia Game</CardTitle>
          <CardDescription>Answer the question below:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p>{currentQuestion.question}</p>
          <div className="grid gap-2">
            {currentQuestion.answers && currentQuestion.answers.map((answer, index) => (
              <Button
                key={index}
                variant={selectedAnswer === answer ? "secondary" : "outline"}
                onClick={() => handleAnswerSelection(answer)}
                className="w-full"
              >
                {answer}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleNextQuestion}>Next Question</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Trivia;
