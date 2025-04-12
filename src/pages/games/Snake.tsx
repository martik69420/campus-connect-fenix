
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Snake: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Snake Game</CardTitle>
          </CardHeader>
          <CardContent>
            <SnakeGameWrapper />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Snake;
