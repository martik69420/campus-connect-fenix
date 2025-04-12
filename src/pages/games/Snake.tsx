
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Snake: React.FC = () => {
  const { toast } = useToast();
  
  const handleGameEnd = async (score: number) => {
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
