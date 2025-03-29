
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import TetrisGame from './TetrisGame';
import AppLayout from '@/components/layout/AppLayout';

const TetrisGameWrapper: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { updateTetrisScore, bestScores } = useGame();
  const [highScore, setHighScore] = useState(bestScores?.tetris || 0);

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
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {t('games.tetris')}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TetrisGame onScoreUpdate={handleScoreUpdate} />
          </div>
          
          <div className="space-y-6">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{t('games.howToPlay')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>{t('games.tetrisInstructions1')}</p>
                  <p>{t('games.tetrisInstructions2')}</p>
                  <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-4">
                    <h3 className="font-semibold mb-2">{t('games.controls')}</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm">←→</span>
                        <span>{t('games.tetrisArrowKeys')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm">↑</span>
                        <span>{t('games.tetrisUpArrow')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm">Space</span>
                        <span>{t('games.tetrisSpacebar')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm">P</span>
                        <span>{t('games.tetrisPKey')}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-md border border-primary/20">
                    <p className="text-primary font-medium">{t('games.earnCoins')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle>{t('games.highScore')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-center text-primary">{highScore}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TetrisGameWrapper;
