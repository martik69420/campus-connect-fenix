
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { BrainCircuit, Terminal, Gamepad, Crown, Trophy, Rocket, Star, Zap, Sparkles, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();

  // Enhanced translations with more impactful language
  const translations = {
    title: 'EPIC GAMES HUB',
    subtitle: 'COMPETE, WIN, EARN REWARDS',
    yourGames: 'YOUR GAMING JOURNEY',
    trivia: 'KNOWLEDGE CHALLENGE',
    triviaDescription: 'Test your intellect & win big',
    snake: 'CLASSIC SNAKE QUEST',
    snakeDescription: 'Master the legendary game',
    progress: 'SKILL PROGRESS',
    played: 'challenges completed',
    playNow: 'PLAY NOW',
    comingSoonTitle: 'UNLEASHING SOON',
    comingSoonDescription: 'New epic game in development',
    new: 'EXCLUSIVE',
    development: 'Development Progress',
    coming: 'COMING SOON',
    gameCenterTitle: 'GAMING UNIVERSE',
    earnCoinsDesc: 'Dominate games, collect coins, unlock exclusive rewards'
  };

  const handleGameClick = () => {
    toast({
      title: translations.coming,
      description: translations.comingSoonTitle
    });
  };

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Enhanced Header with dramatic styling */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8 } }
          }}
          className="mb-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 p-8 rounded-lg shadow-md border border-indigo-500/20"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            {translations.gameCenterTitle}
          </h1>
          <p className="text-muted-foreground mt-2 text-xl">
            {translations.earnCoinsDesc}
          </p>
          
          <div className="flex items-center gap-3 mt-6 bg-background/70 p-4 rounded-md backdrop-blur-sm w-fit border border-indigo-500/30">
            <Trophy className="h-7 w-7 text-amber-500" />
            <div className="text-foreground/90">
              <span className="text-xl font-semibold">
                {translations.yourGames}: <span className="text-primary">{gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed + gameState.progress.trivia.gamesPlayed}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Game cards with improved visual design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trivia Game Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-transparent z-0 opacity-80"></div>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                      <BrainCircuit className="w-6 h-6 text-indigo-400" />
                      {translations.trivia}
                    </CardTitle>
                    <CardDescription className="text-base text-foreground/80">{translations.triviaDescription}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/40 font-bold px-3 py-1.5">
                    <Crown className="w-4 h-4 mr-1.5" />
                    {bestScores.trivia}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{translations.progress}</span>
                    <span className="font-bold">{gameState.progress.trivia.gamesPlayed} {translations.played}</span>
                  </div>
                  <Progress 
                    value={Math.min(gameState.progress.trivia.gamesPlayed * 10, 100)} 
                    className="h-3 bg-background/60" 
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 relative z-10">
                <Button 
                  onClick={() => navigate('/trivia')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold text-lg py-6"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {translations.playNow}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Snake Game Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent z-0 opacity-80"></div>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                      <Terminal className="w-6 h-6 text-emerald-500" />
                      {translations.snake}
                    </CardTitle>
                    <CardDescription className="text-base text-foreground/80">{translations.snakeDescription}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/40 font-bold px-3 py-1.5">
                    <Crown className="w-4 h-4 mr-1.5" />
                    {bestScores.snake}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{translations.progress}</span>
                    <span className="font-bold">{gameState.progress.snake.gamesPlayed} {translations.played}</span>
                  </div>
                  <Progress 
                    value={Math.min(gameState.progress.snake.gamesPlayed * 10, 100)} 
                    className="h-3 bg-background/60" 
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 relative z-10">
                <Button 
                  onClick={() => navigate('/snake')} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-lg py-6"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {translations.playNow}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Coming Soon Game Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card dark:bg-card/95 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent z-0 opacity-80"></div>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-400"></div>
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                      <Gamepad className="w-6 h-6 text-amber-500" />
                      {translations.comingSoonTitle}
                    </CardTitle>
                    <CardDescription className="text-base text-foreground/80">{translations.comingSoonDescription}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/40 font-bold px-3 py-1.5">
                    <Star className="w-4 h-4 mr-1.5" />
                    {translations.new}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{translations.development}</span>
                    <span className="font-bold">75%</span>
                  </div>
                  <Progress 
                    value={75} 
                    className="h-3 bg-background/60" 
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 relative z-10">
                <Button 
                  onClick={handleGameClick} 
                  disabled 
                  className="w-full bg-muted hover:bg-muted/90 font-bold text-lg py-6"
                >
                  <Award className="w-5 h-5 mr-2" />
                  {translations.coming}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
