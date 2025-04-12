
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TriviaGame from '@/components/game/TriviaGame';

const Trivia: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Trivia Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <TriviaGame />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Trivia;
