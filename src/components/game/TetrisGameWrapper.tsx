
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import TetrisGame from './TetrisGame';

const TetrisGameWrapper: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { updateTetrisScore } = useGame();
  const [highScore, setHighScore] = useState(0);

  const handleScoreUpdate = useCallback((score: number) => {
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Save score to game context/history
    if (score > 0) {
      updateTetrisScore(score);
    }
  }, [highScore, updateTetrisScore]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('games.tetris')}</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <TetrisGame onScoreUpdate={handleScoreUpdate} />
        
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>{t('games.howToPlay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>{t('games.tetrisInstructions1')}</p>
              <p>{t('games.tetrisInstructions2')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('games.tetrisArrowKeys')}</li>
                <li>{t('games.tetrisUpArrow')}</li>
                <li>{t('games.tetrisSpacebar')}</li>
                <li>{t('games.tetrisPKey')}</li>
              </ul>
              <p className="text-primary font-medium">{t('games.earnCoins')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TetrisGameWrapper;
