
import React, { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Gamepad, Trophy, History, Zap, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Snake: React.FC = () => {
  const { t } = useLanguage();
  const { bestScores, gameState } = useGame();

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Header with improved styling */}
        <div className="mb-8 bg-gradient-to-r from-emerald-500/10 to-green-500/5 p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gamepad className="h-7 w-7 text-emerald-500" />
            {t('games.snake') || "Snake Game"}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{t('games.snakeDescription') || "Classic snake game"}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Stats Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Trophy className="w-5 h-5 text-amber-500 mr-2" />
                    {t('games.stats') || "Stats"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md">
                    <span className="text-sm font-medium">{t('games.highScore') || "High Score"}</span>
                    <Badge variant="secondary" className="text-primary font-bold bg-primary/10 px-3">
                      <Award className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {bestScores.snake}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md">
                    <span className="text-sm font-medium">{t('games.gamesPlayed') || "Games Played"}</span>
                    <Badge variant="outline" className="font-medium px-3">
                      {gameState.progress.snake.gamesPlayed}
                    </Badge>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm font-semibold mb-1">{t('games.controls') || "Controls"}</div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-2.5 rounded">
                      <span className="font-medium">←→↑↓</span>
                      <span>{t('games.moveSnake') || "Move Snake"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-2.5 rounded">
                      <span className="font-medium">Space</span>
                      <span>{t('games.pauseResume') || "Pause/Resume"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <History className="w-5 h-5 text-blue-500 mr-2" />
                    {t('games.rewards') || "Rewards"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('games.snakeRewardInfo') || "Earn coins based on your snake game score"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md border border-border/30">
                      <span className="text-xs text-muted-foreground">Score 10+</span>
                      <span className="text-base font-bold flex items-center mt-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500 mr-1" />
                        1 coin
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md border border-border/30">
                      <span className="text-xs text-muted-foreground">Score 50+</span>
                      <span className="text-base font-bold flex items-center mt-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500 mr-1" />
                        5 coins
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Gamepad className="w-5 h-5 text-emerald-500 mr-2" />
                    {t('games.snake') || "Snake"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t('games.snakeDescription') || "Classic snake game"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-xl border-4 border-emerald-500/20 rounded-lg overflow-hidden">
                    <SnakeGameWrapper />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    <p>{t('games.snakeInstructions') || "Use arrow keys to control the snake"}</p>
                    <p className="mt-1 text-foreground/70 font-medium">{t('games.collectFood') || "Collect food to grow and earn points"}</p>
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
