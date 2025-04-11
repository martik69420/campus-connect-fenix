
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import TriviaGame from '@/components/game/TriviaGame';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { BrainCircuit, Trophy, Lightbulb, Coins, Award, Flame, Medal, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

const Trivia: React.FC = () => {
  const { t } = useLanguage();
  const { bestScores, gameState } = useGame();
  
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
          className="mb-8 bg-gradient-to-r from-indigo-500/10 via-purple-400/5 to-purple-500/5 p-6 rounded-xl shadow-sm border border-indigo-500/20"
        >
          <div className="relative">
            <div className="absolute -top-14 -right-8 text-8xl font-bold text-indigo-500/5 rotate-2">
              TRIVIA
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BrainCircuit className="h-7 w-7 text-indigo-500" />
              {t('games.trivia') || "Trivia Challenge"}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">{t('games.triviaDescription') || "Test your knowledge"}</p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Stats Card */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-1 space-y-4"
          >
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <motion.div 
                className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"
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
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-indigo-500/10">
                    <span className="text-sm font-medium">{t('games.highScore') || "High Score"}</span>
                    <Badge variant="secondary" className="text-indigo-500 font-bold bg-indigo-500/10 px-3 py-1 group-hover:bg-indigo-500/20 transition-colors">
                      <Award className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {bestScores.trivia}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-indigo-500/10">
                    <span className="text-sm font-medium">{t('games.gamesPlayed') || "Games Played"}</span>
                    <Badge variant="outline" className="font-medium px-3 py-1">
                      {gameState.progress.trivia.gamesPlayed}
                    </Badge>
                  </div>

                  <div className="flex flex-col space-y-3 mt-4 bg-muted/20 p-4 rounded-lg border border-indigo-500/10">
                    <div className="flex items-center text-sm font-semibold mb-1">
                      <Coins className="w-4 h-4 mr-2 text-amber-500" />
                      {t('games.rewards') || "Rewards"}
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-3 rounded border border-indigo-500/5">
                      <span className="font-medium">10 points</span>
                      <span className="flex items-center">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">1 coin</Badge>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-3 rounded border border-indigo-500/5">
                      <span className="font-medium">50 points</span>
                      <span className="flex items-center">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">5 coins</Badge>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Lightbulb className="w-5 h-5 text-amber-500 mr-2" />
                    {t('games.howToPlay') || "How To Play"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('games.triviaRules') || "Answer questions correctly to earn points"}
                  </p>
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                      <BadgeCheck className="w-4 h-4 text-indigo-400 mr-2" />
                      <span className="text-sm">{t('games.triviaRule1') || "You have 15 seconds per question"}</span>
                    </div>
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                      <BadgeCheck className="w-4 h-4 text-indigo-400 mr-2" />
                      <span className="text-sm">{t('games.triviaRule2') || "Each correct answer is worth 10 points"}</span>
                    </div>
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                      <BadgeCheck className="w-4 h-4 text-indigo-400 mr-2" />
                      <span className="text-sm">{t('games.triviaRule3') || "Earn coins based on your final score"}</span>
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
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden h-full">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <BrainCircuit className="w-5 h-5 text-indigo-500 mr-2" />
                    {t('games.trivia') || "Trivia Challenge"}
                  </CardTitle>
                  <Badge variant="outline" className="text-indigo-500 border-indigo-500/40">
                    <Medal className="w-3.5 h-3.5 mr-1.5" />
                    Best: {bestScores.trivia}
                  </Badge>
                </div>
                <CardDescription>
                  {t('games.triviaDescription') || "Test your knowledge"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-col items-center justify-center">
                  <motion.div 
                    className="w-full rounded-lg overflow-hidden bg-card p-4 border border-indigo-500/10"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <TriviaGame onGameEnd={async (score) => {
                      // Game end logic is handled by the GameContext through the TriviaGame component
                    }} />
                  </motion.div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-0">
                <div className="text-xs text-muted-foreground italic flex items-center">
                  <Flame className="h-3 w-3 mr-1 text-amber-500" />
                  Answer quickly for maximum points!
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
        
        {/* Statistics and achievements section */}
        <motion.div 
          variants={itemVariants}
          className="mt-8"
        >
          <Card className="bg-card dark:bg-card/95 shadow-md border-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Award className="w-5 h-5 text-amber-500 mr-2" />
                Achievements & Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-4 p-3 bg-background/50 rounded-lg border border-indigo-500/10">
                  <div className="bg-indigo-500/10 p-2 rounded-full">
                    <BrainCircuit className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Knowledge Level</p>
                    <p className="text-lg font-bold">
                      {bestScores.trivia >= 100 ? 'Expert' : 
                       bestScores.trivia >= 50 ? 'Advanced' : 
                       bestScores.trivia >= 20 ? 'Intermediate' : 'Beginner'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-background/50 rounded-lg border border-indigo-500/10">
                  <div className="bg-indigo-500/10 p-2 rounded-full">
                    <Medal className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-lg font-bold">
                      {bestScores.trivia * gameState.progress.trivia.gamesPlayed}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-background/50 rounded-lg border border-indigo-500/10">
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Coins className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coins Earned</p>
                    <p className="text-lg font-bold">
                      {Math.floor(bestScores.trivia / 10) * gameState.progress.trivia.gamesPlayed}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Trivia;
