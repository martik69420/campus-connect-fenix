
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

const Snake: React.FC = () => {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <Card className="bg-card dark:bg-card/95 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle>{t('games.snake')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-xl">
                <SnakeGameWrapper />
              </div>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                <p>Use arrow keys to control the snake. Press space to pause/resume.</p>
                <p className="mt-1">Collect food to grow and earn points!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Snake;
