
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import TetrisGame from './TetrisGame';

const TetrisGameWrapper: React.FC = () => {
  const { t } = useLanguage();
  const { user, addCoins } = useAuth();
  const [highScore, setHighScore] = useState(0);

  const handleScoreUpdate = useCallback((score: number) => {
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Give coins for every 1000 points
    const coinsThreshold = 1000;
    if (score % coinsThreshold === 0 && score > 0 && addCoins) {
      addCoins(10, `Tetris score milestone: ${score}`);
    }
  }, [highScore, addCoins]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('games.tetris')}</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <TetrisGame onScoreUpdate={handleScoreUpdate} />
        
        <Card>
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
              <p>{t('games.earnCoins')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TetrisGameWrapper;
