
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TriviaGame from '@/components/game/TriviaGame';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

const Trivia: React.FC = () => {
  const { updateGameScore } = useGame();
  const { addCoins } = useAuth();
  const { toast } = useToast();
  
  const handleGameEnd = (score: number, totalQuestions: number) => {
    // Update the score
    updateGameScore('trivia', score);
    
    // Calculate coins based on percentage correct
    const percentCorrect = (score / totalQuestions) * 100;
    let coinsEarned = 0;
    
    if (percentCorrect >= 80) {
      coinsEarned = 50;
    } else if (percentCorrect >= 60) {
      coinsEarned = 30;
    } else if (percentCorrect >= 40) {
      coinsEarned = 20;
    } else if (percentCorrect > 0) {
      coinsEarned = 10;
    }
    
    if (coinsEarned > 0) {
      addCoins(coinsEarned, `Trivia game: ${score}/${totalQuestions} correct`);
      
      toast({
        title: "Coins earned!",
        description: `You earned ${coinsEarned} coins for your trivia performance!`,
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Trivia Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <TriviaGame onGameEnd={handleGameEnd} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Trivia;
