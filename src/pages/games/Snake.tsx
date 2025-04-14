
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';

const Snake: React.FC = () => {
  const { toast } = useToast();
  const { updateGameScore } = useGame();
  
  const handleGameEnd = async (score: number) => {
    // Update game score in context
    updateGameScore('snake', score);
    
    toast({
      title: "Game Over!",
      description: `Your score: ${score}`,
    });
    
    // Any additional game end logic could go here
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Snake Game</CardTitle>
            <CardDescription>
              Use arrow keys to control the snake. Collect food to grow and earn points!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SnakeGameWrapper onGameEnd={handleGameEnd} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Snake;
