
import React, { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import TriviaGame from '@/components/game/TriviaGame';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { BrainCircuit, Trophy, History, Zap, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Trivia: React.FC = () => {
  const { t } = useLanguage();
  const { bestScores, gameState } = useGame();
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Header with improved styling */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-indigo-500" />
            {t('games.trivia') || "Trivia Game"}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{t('games.triviaDescription') || "Test your knowledge"}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Stats Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
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
                    <Badge variant="secondary" className="text-indigo-500 font-bold bg-indigo-500/10 px-3">
                      <Award className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {bestScores.trivia}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-md">
                    <span className="text-sm font-medium">{t('games.gamesPlayed') || "Games Played"}</span>
                    <Badge variant="outline" className="font-medium px-3">
                      {gameState.progress.trivia.gamesPlayed}
                    </Badge>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm font-semibold mb-1">{t('games.rewards') || "Rewards"}</div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-2.5 rounded">
                      <span className="font-medium">10 points</span>
                      <span>1 coin</span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-background/70 p-2.5 rounded">
                      <span className="font-medium">50 points</span>
                      <span>5 coins</span>
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
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-border/30">
                      <span className="text-xs text-muted-foreground mr-2">•</span>
                      <span className="text-sm">{t('games.triviaRule1') || "You have 15 seconds per question"}</span>
                    </div>
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-border/30">
                      <span className="text-xs text-muted-foreground mr-2">•</span>
                      <span className="text-sm">{t('games.triviaRule2') || "Each correct answer is worth 10 points"}</span>
                    </div>
                    <div className="flex items-center p-3 bg-background/50 rounded-md border border-border/30">
                      <span className="text-xs text-muted-foreground mr-2">•</span>
                      <span className="text-sm">{t('games.triviaRule3') || "Earn coins based on your final score"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card dark:bg-card/95 shadow-lg border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <BrainCircuit className="w-5 h-5 text-indigo-500 mr-2" />
                    {t('games.trivia') || "Trivia"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t('games.triviaDescription') || "Test your knowledge"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full">
                    <TriviaGame onGameEnd={async (score) => {
                      // Game end logic is handled by the GameContext through the TriviaGame component
                    }} />
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

export default Trivia;
