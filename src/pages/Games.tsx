
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import TriviaGame from '@/components/game/TriviaGame';
import TetrisGameWrapper from '@/components/game/TetrisGameWrapper';

const Games = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('snake');
  
  // Create an async wrapper function for TriviaGame's onGameEnd
  const handleTriviaGameEnd = async (score: number) => {
    // Handle the trivia game end event
    console.log("Trivia game ended with score:", score);
    // Return a promise to satisfy the type requirement
    return Promise.resolve();
  };
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('games.title')}</h1>
        
        <Tabs defaultValue="snake" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="snake">Snake</TabsTrigger>
            <TabsTrigger value="trivia">Trivia</TabsTrigger>
            <TabsTrigger value="tetris">Tetris</TabsTrigger>
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
