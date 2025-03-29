
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import TriviaGame from '@/components/game/TriviaGame';
import TetrisGameWrapper from '@/components/game/TetrisGameWrapper';
import { useAuth } from '@/context/AuthContext';

const Games = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { addCoins } = useAuth();
  const [activeTab, setActiveTab] = useState('snake');
  
  // Create an async wrapper function for TriviaGame's onGameEnd
  const handleTriviaGameEnd = async (score: number) => {
    // Handle the trivia game end event
    console.log("Trivia game ended with score:", score);
    
    // Add coins based on score
    if (score > 0) {
      addCoins(score);
    }
    
    // Show toast when game ends - Fixed to use single parameter
    if (score > 0) {
      toast({
        title: t('games.completed'),
        description: t('games.scoreEarned', { score: score.toString() }),
      });
    }
    
    // Return a promise to satisfy the type requirement
    return Promise.resolve();
  };
  
  // Use URL hash to remember the active tab
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === 'tetris' || hash === 'trivia' || hash === 'snake') {
      setActiveTab(hash);
    }
  }, []);
  
  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('games.title')}</h1>
        
        <Tabs defaultValue="snake" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="snake">{t('games.snakeGame')}</TabsTrigger>
            <TabsTrigger value="trivia">{t('games.triviaGame')}</TabsTrigger>
            <TabsTrigger value="tetris">{t('games.tetrisGame')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="snake" className="w-full">
            <SnakeGameWrapper />
          </TabsContent>
          
          <TabsContent value="trivia" className="w-full">
            <TriviaGame onGameEnd={handleTriviaGameEnd} />
          </TabsContent>
          
          <TabsContent value="tetris" className="w-full">
            <TetrisGameWrapper />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Games;
