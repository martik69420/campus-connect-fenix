
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Terminal, BarChart } from 'lucide-react';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleGameClick = () => {
    toast({
      title: t('games.coming'),
      description: t('games.comingSoon')
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trivia Game Card */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-primary" />
                {t('games.trivia')}
              </CardTitle>
              <CardDescription>{t('games.triviaDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/trivia')} className="w-full">{t('games.playNow')}</Button>
            </CardContent>
          </Card>

          {/* Snake Game Card */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-6 h-6 text-primary" />
                {t('games.snake')}
              </CardTitle>
              <CardDescription>{t('games.snakeDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/snake')} className="w-full">{t('games.playNow')}</Button>
            </CardContent>
          </Card>

          {/* Coming Soon Game Card - Example */}
          <Card className="bg-card dark:bg-card/95 shadow-md hover:shadow-lg transition-shadow duration-200 opacity-70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-6 h-6 text-muted-foreground" />
                {t('games.comingSoon')}
              </CardTitle>
              <CardDescription>{t('games.comingSoonDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGameClick} disabled className="w-full">{t('games.playNow')}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
