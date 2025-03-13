import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Gamepad2, Trophy, Coins, Clock, ArrowRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const Games = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { gameStats, updateGameStats } = useGame();
  
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleStartGame = (gameId: string) => {
    setActiveGame(gameId);
  };
  
  const handleExitGame = () => {
    setActiveGame(null);
  };
  
  const games = [
    {
      id: 'snake',
      name: 'Snake',
      description: 'Classic snake game. Eat the food, grow longer, and avoid hitting the walls or yourself.',
      image: '/games/snake.png',
      rewards: '5-20 coins per game',
      component: <SnakeGameWrapper />
    },
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Arrange falling blocks to create complete rows. Clear multiple rows at once for bonus points!',
      image: '/games/tetris.png',
      rewards: '10-30 coins per game',
      component: <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">Coming Soon</div>
    },
    {
      id: 'quiz',
      name: 'Campus Quiz',
      description: 'Test your knowledge about your campus and earn coins for correct answers.',
      image: '/games/quiz.png',
      rewards: '2 coins per correct answer',
      component: <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">Coming Soon</div>
    }
  ];
  
  const activeGameData = games.find(game => game.id === activeGame);
  
  if (activeGame && activeGameData) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{activeGameData.name}</h1>
              <p className="text-muted-foreground">{activeGameData.description}</p>
            </div>
            <Button variant="outline" onClick={handleExitGame}>
              Exit Game
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {activeGameData.component}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Games</h1>
            <p className="text-muted-foreground">Play games to earn coins and have fun</p>
          </div>
        </div>
        
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="games">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    <div className="aspect-video bg-muted relative">
                      <img 
                        src={game.image} 
                        alt={game.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {game.rewards}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle>{game.name}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto">
                      <Button 
                        className="w-full" 
                        onClick={() => handleStartGame(game.id)}
                      >
                        Play Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Game Leaderboard</CardTitle>
                <CardDescription>Top players this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Alex Johnson', game: 'Snake', score: 1250, avatar: '/placeholder.svg' },
                    { name: 'Sam Wilson', game: 'Tetris', score: 980, avatar: '/placeholder.svg' },
                    { name: 'Jamie Smith', game: 'Quiz', score: 850, avatar: '/placeholder.svg' },
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-medium">{player.name}</h3>
                          <p className="text-sm text-muted-foreground">{player.game}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {player.score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Games;
