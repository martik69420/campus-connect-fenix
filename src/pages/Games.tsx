
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { BrainCircuit, Terminal, GamepadDice, Crown, Trophy, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();

  const handleGameClick = () => {
    toast({
      title: t('games.coming'),
      description: t('games.comingSoon')
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('games.title')}</h1>
            <p className="text-muted-foreground">{t('games.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">
              {t('games.yourGames')}: {gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed + gameState.progress.trivia.gamesPlayed}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trivia Game Card */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-indigo-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" />
                    {t('games.trivia')}
                  </CardTitle>
                  <CardDescription>{t('games.triviaDescription')}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  {bestScores.trivia}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span>{t('games.progress')}</span>
                  <span>{gameState.progress.trivia.gamesPlayed} {t('games.played')}</span>
                </div>
                <Progress value={Math.min(gameState.progress.trivia.gamesPlayed * 10, 100)} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button onClick={() => navigate('/trivia')} className="w-full bg-indigo-500 hover:bg-indigo-600">{t('games.playNow')}</Button>
            </CardFooter>
          </Card>

          {/* Snake Game Card */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-green-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-green-500" />
                    {t('games.snake')}
                  </CardTitle>
                  <CardDescription>{t('games.snakeDescription')}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  {bestScores.snake}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span>{t('games.progress')}</span>
                  <span>{gameState.progress.snake.gamesPlayed} {t('games.played')}</span>
                </div>
                <Progress value={Math.min(gameState.progress.snake.gamesPlayed * 10, 100)} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button onClick={() => navigate('/snake')} className="w-full bg-green-500 hover:bg-green-600">{t('games.playNow')}</Button>
            </CardFooter>
          </Card>

          {/* Coming Soon Game Card */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-gray-400 opacity-80">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <GamepadDice className="w-5 h-5 text-gray-500" />
                    {t('games.comingSoon')}
                  </CardTitle>
                  <CardDescription>{t('games.comingSoonDescription')}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
                  <Rocket className="w-3.5 h-3.5 mr-1" />
                  {t('games.new')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span>{t('games.development')}</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button onClick={handleGameClick} disabled className="w-full">{t('games.playNow')}</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
