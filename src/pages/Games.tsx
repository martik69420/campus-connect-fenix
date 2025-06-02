
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { 
  BrainCircuit, 
  Terminal, 
  Gamepad, 
  Crown, 
  Trophy, 
  Star,
  Award 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();

  // Simplified translations with more consistent language
  const translations = {
    title: 'Games Hub',
    subtitle: 'Play games and compete with friends',
    yourGames: 'Your Progress',
    trivia: 'Trivia Challenge',
    triviaDescription: 'Test your knowledge across various topics',
    snake: 'Snake Game',
    snakeDescription: 'Classic arcade snake game',
    progress: 'Progress',
    played: 'games played',
    playNow: 'Play Now',
    comingSoonTitle: 'Tetris',
    comingSoonDescription: 'Classic block-stacking puzzle',
    new: 'NEW',
    development: 'Development',
    coming: 'Coming Soon',
    gameCenterTitle: 'Games',
    earnCoinsDesc: 'Play games and track your progress'
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
        {/* Header with consistent styling */}
        <div className="mb-8 bg-card p-6 rounded-lg border">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {translations.gameCenterTitle}
          </h1>
          <p className="text-muted-foreground text-lg">
            {translations.earnCoinsDesc}
          </p>
          
          <div className="flex items-center gap-3 mt-4 bg-muted/50 p-3 rounded-md w-fit">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <div className="text-foreground">
              <span className="font-medium">
                {translations.yourGames}: <span className="text-primary">{gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed + gameState.progress.trivia.gamesPlayed}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Game cards with consistent theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trivia Game Card */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                    {translations.trivia}
                  </CardTitle>
                  <CardDescription>{translations.triviaDescription}</CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium">
                  <Crown className="w-3 h-3 mr-1" />
                  {bestScores.trivia}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{translations.progress}</span>
                  <span className="font-medium">{gameState.progress.trivia.gamesPlayed} {translations.played}</span>
                </div>
                <Progress 
                  value={Math.min(gameState.progress.trivia.gamesPlayed * 10, 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/games/trivia')} 
                className="w-full"
              >
                {translations.playNow}
              </Button>
            </CardFooter>
          </Card>

          {/* Snake Game Card */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Terminal className="w-5 h-5 text-green-600" />
                    {translations.snake}
                  </CardTitle>
                  <CardDescription>{translations.snakeDescription}</CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium">
                  <Crown className="w-3 h-3 mr-1" />
                  {bestScores.snake}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{translations.progress}</span>
                  <span className="font-medium">{gameState.progress.snake.gamesPlayed} {translations.played}</span>
                </div>
                <Progress 
                  value={Math.min(gameState.progress.snake.gamesPlayed * 10, 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/games/snake')} 
                className="w-full"
              >
                {translations.playNow}
              </Button>
            </CardFooter>
          </Card>

          {/* Coming Soon Game Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 opacity-75">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Gamepad className="w-5 h-5 text-purple-600" />
                    {translations.comingSoonTitle}
                  </CardTitle>
                  <CardDescription>{translations.comingSoonDescription}</CardDescription>
                </div>
                <Badge variant="outline" className="font-medium">
                  <Star className="w-3 h-3 mr-1" />
                  {translations.new}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{translations.development}</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="bg-muted/50 p-2 mt-3 rounded text-sm text-muted-foreground">
                  Classic puzzle game coming soon
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGameClick} 
                disabled 
                variant="secondary"
                className="w-full"
              >
                <Award className="w-4 h-4 mr-2" />
                {translations.coming}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Game Stats Section */}
        <div className="mt-8 bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-semibold">Your Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">Trivia</Badge>
              <p className="text-2xl font-bold">{bestScores.trivia}</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">Snake</Badge>
              <p className="text-2xl font-bold">{bestScores.snake}</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">Total</Badge>
              <p className="text-2xl font-bold">{gameState.progress.snake.gamesPlayed + gameState.progress.trivia.gamesPlayed}</p>
              <p className="text-sm text-muted-foreground">Games Played</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
