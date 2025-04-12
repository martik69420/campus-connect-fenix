import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Gamepad, Trophy, History, Zap, Award, KeyRound, Coins, Flame, FastForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Snake: React.FC = () => {
  const { t } = useLanguage();
  const { bestScores, gameState } = useGame();
  const { toast } = useToast();
  
  const handleGameEnd = async (score: number) => {
    toast({
      title: "Game Over!",
      description: `Your score: ${score}`,
    });
    
    // Any additional game end logic could go here
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <AppLayout>
      <motion.div 
        className="container mx-auto py-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with improved styling */}
        <motion.div 
          variants={itemVariants}
          className="mb-8 bg-gradient-to-r from-emerald-500/10 via-green-400/10 to-green-500/5 p-6 rounded-xl shadow-sm border border-emerald-500/20"
        >
          <div className="relative">
            <div className="absolute -top-14 -right-8 text-8xl font-bold text-emerald-500/5 rotate-6">
              SNAKE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Gamepad className="h-7 w-7 text-emerald-500" />
              {t('games.snake') || "Snake Game"}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">{t('games.snakeDescription') || "Classic snake game"}</p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Stats Card */}
          <motion.div 
            variants={itemVariants} 
            className="lg:col-span-1 space-y-4"
          >
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <motion.div 
                className="absolute -right-16 -top-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.1, 1], 
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
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
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-emerald-500/10">
                    <span className="text-sm font-medium">{t('games.highScore') || "High Score"}</span>
                    <Badge variant="secondary" className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 group-hover:bg-emerald-500/20 transition-colors">
                      <Award className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                      {bestScores.snake}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-emerald-500/10">
                    <span className="text-sm font-medium">{t('games.gamesPlayed') || "Games Played"}</span>
                    <Badge variant="outline" className="font-medium px-3 py-1">
                      {gameState.progress.snake.gamesPlayed}
                    </Badge>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 bg-muted/20 p-4 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center text-sm font-semibold mb-1">
                      <KeyRound className="w-4 h-4 mr-2 text-emerald-500" />
                      {t('games.controls') || "Controls"}
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-3 rounded border border-emerald-500/5">
                      <span className="font-medium">←→↑↓</span>
                      <span>{t('games.moveSnake') || "Move Snake"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-3 rounded border border-emerald-500/5">
                      <span className="font-medium">Space</span>
                      <span>{t('games.pauseResume') || "Pause/Resume"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Coins className="w-5 h-5 text-amber-500 mr-2" />
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
                    <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                      <span className="text-xs text-muted-foreground">Score 10+</span>
                      <span className="text-base font-bold flex items-center mt-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500 mr-1" />
                        1 coin
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
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
          </motion.div>

          {/* Game Area */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2"
          >
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Gamepad className="w-5 h-5 text-emerald-500 mr-2" />
                    {t('games.snake') || "Snake"}
                  </CardTitle>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">
                    Best: {bestScores.snake}
                  </Badge>
                </div>
                <CardDescription>
                  {t('games.snakeDescription') || "Classic snake game"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <motion.div 
                    className="w-full max-w-xl border-4 border-emerald-500/20 rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <SnakeGameWrapper onGameEnd={handleGameEnd} />
                  </motion.div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 inline-block">
                      <p className="flex items-center">
                        <FastForward className="h-4 w-4 mr-2 text-emerald-400" />
                        {t('games.snakeInstructions') || "Use arrow keys to control the snake"}
                      </p>
                    </div>
                    <p className="mt-3 text-foreground/70 font-medium">{t('games.collectFood') || "Collect food to grow and earn points"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-1">
                <div className="text-xs text-muted-foreground italic">
                  The game speed increases as your score gets higher. Good luck!
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Snake;
