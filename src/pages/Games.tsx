
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { BrainCircuit, Terminal, Gamepad, Crown, Trophy, Rocket, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();

  // Fallback translations to prevent warnings
  const translations = {
    title: t('games.title') || 'Games',
    subtitle: t('games.subtitle') || 'Play and earn coins',
    yourGames: t('games.yourGames') || 'Games Played',
    trivia: t('games.trivia') || 'Trivia',
    triviaDescription: t('games.triviaDescription') || 'Test your knowledge',
    snake: t('games.snake') || 'Snake',
    snakeDescription: t('games.snakeDescription') || 'Classic snake game',
    progress: t('games.progress') || 'Progress',
    played: t('games.played') || 'games played',
    playNow: t('games.playNow') || 'Play Now',
    comingSoonTitle: t('games.comingSoon') || 'Coming Soon',
    comingSoonDescription: t('games.comingSoonDescription') || 'New game arriving soon',
    new: t('games.new') || 'New',
    development: t('games.development') || 'In development',
    coming: t('games.coming') || 'Coming Soon',
    gameCenterTitle: t('games.gameCenterTitle') || 'Game Center',
    earnCoinsDesc: t('games.earnCoinsDesc') || 'Play games, earn coins, unlock rewards'
  };

  const handleGameClick = () => {
    toast({
      title: translations.coming,
      description: translations.comingSoonTitle
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Header with improved styling */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{translations.gameCenterTitle}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{translations.earnCoinsDesc}</p>
          
          <div className="flex items-center gap-3 mt-4 bg-background/60 p-3 rounded-md backdrop-blur-sm w-fit">
            <Trophy className="h-6 w-6 text-amber-500" />
            <div className="text-foreground/80">
              <span className="text-lg font-semibold">
                {translations.yourGames}: {gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed + gameState.progress.trivia.gamesPlayed}
              </span>
            </div>
          </div>
        </div>

        {/* Game cards with improved visual design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trivia Game Card */}
          <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent z-0 opacity-70"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BrainCircuit className="w-6 h-6 text-indigo-500" />
                    {translations.trivia}
                  </CardTitle>
                  <CardDescription className="text-base text-foreground/70">{translations.triviaDescription}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 font-semibold px-2.5">
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  {bestScores.trivia}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{translations.progress}</span>
                  <span className="font-semibold">{gameState.progress.trivia.gamesPlayed} {translations.played}</span>
                </div>
                <Progress value={Math.min(gameState.progress.trivia.gamesPlayed * 10, 100)} className="h-2.5 bg-background/50" indicatorClassName="bg-indigo-500" />
              </div>
            </CardContent>
            <CardFooter className="pt-2 relative z-10">
              <Button onClick={() => navigate('/trivia')} className="w-full bg-indigo-500 hover:bg-indigo-600 font-medium">
                <Zap className="w-4 h-4 mr-2" />
                {translations.playNow}
              </Button>
            </CardFooter>
          </Card>

          {/* Snake Game Card */}
          <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent z-0 opacity-70"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Terminal className="w-6 h-6 text-emerald-500" />
                    {translations.snake}
                  </CardTitle>
                  <CardDescription className="text-base text-foreground/70">{translations.snakeDescription}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold px-2.5">
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  {bestScores.snake}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{translations.progress}</span>
                  <span className="font-semibold">{gameState.progress.snake.gamesPlayed} {translations.played}</span>
                </div>
                <Progress value={Math.min(gameState.progress.snake.gamesPlayed * 10, 100)} className="h-2.5 bg-background/50" indicatorClassName="bg-emerald-500" />
              </div>
            </CardContent>
            <CardFooter className="pt-2 relative z-10">
              <Button onClick={() => navigate('/snake')} className="w-full bg-emerald-500 hover:bg-emerald-600 font-medium">
                <Zap className="w-4 h-4 mr-2" />
                {translations.playNow}
              </Button>
            </CardFooter>
          </Card>

          {/* Coming Soon Game Card */}
          <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent z-0 opacity-70"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400/50"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Gamepad className="w-6 h-6 text-amber-500" />
                    {translations.comingSoonTitle}
                  </CardTitle>
                  <CardDescription className="text-base text-foreground/70">{translations.comingSoonDescription}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold px-2.5">
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  {translations.new}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{translations.development}</span>
                  <span className="font-semibold">75%</span>
                </div>
                <Progress value={75} className="h-2.5 bg-background/50" indicatorClassName="bg-amber-500" />
              </div>
            </CardContent>
            <CardFooter className="pt-2 relative z-10">
              <Button onClick={handleGameClick} disabled className="w-full bg-muted hover:bg-muted/90 font-medium">
                <Rocket className="w-4 h-4 mr-2" />
                {translations.coming}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
