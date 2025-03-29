
import React, { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { GameController, Trophy, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Snake: React.FC = () => {
  const { t } = useLanguage();
  const { bestScores, gameState } = useGame();

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Stats Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card dark:bg-card/95 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                    {t('games.stats')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('games.highScore')}</span>
                    <Badge variant="secondary" className="text-primary font-bold">
                      {bestScores.snake}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('games.gamesPlayed')}</span>
                    <Badge variant="outline" className="font-medium">
                      {gameState.progress.snake.gamesPlayed}
                    </Badge>
                  </div>

                  <div className="flex flex-col space-y-1 mt-4">
                    <div className="text-sm font-medium mb-1">{t('games.controls')}</div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      <span>←→↑↓</span>
                      <span>{t('games.moveSnake')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      <span>Space</span>
                      <span>{t('games.pauseResume')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card/95 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 text-blue-500 mr-2" />
                    {t('games.rewards')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('games.snakeRewardInfo')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-md">
                      <span className="text-xs text-muted-foreground">Score 10+</span>
                      <span className="text-sm font-bold">1 coin</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-md">
                      <span className="text-xs text-muted-foreground">Score 50+</span>
                      <span className="text-sm font-bold">5 coins</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card dark:bg-card/95 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <GameController className="w-5 h-5 text-primary mr-2" />
                    {t('games.snake')}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t('games.snakeDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-xl">
                    <SnakeGameWrapper />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    <p>{t('games.snakeInstructions')}</p>
                    <p className="mt-1">{t('games.collectFood')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Snake;
