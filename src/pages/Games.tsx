import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TriviaGame from '@/components/game/TriviaGame';
import SnakeGame from '@/components/game/SnakeGame';
import { BrainCircuit, Calendar, CoinsIcon, Gift, Trophy, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const Games = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, addCoins } = useAuth();
  const { hasDailyRewardAvailable, claimDailyReward, progress } = useGame();
  
  const [showTriviaGame, setShowTriviaGame] = useState(false);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleTriviaGameEnd = async (score: number) => {
    if (!user) return;
    
    try {
      const coinsToAward = score > progress.trivia.highScore 
        ? score * 2 // Bonus for high score
        : Math.floor(score / 2);
      
      addCoins(coinsToAward, score > progress.trivia.highScore 
        ? "New trivia high score!" 
        : "Trivia game completed");
      
      toast({
        title: score > progress.trivia.highScore ? "New high score!" : "Game completed!",
        description: `You've earned ${coinsToAward} coins!`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving game results",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleSnakeGameEnd = async (score: number) => {
    if (!user) return;
    
    try {
      // Calculate coins based on score (1 coin per 10 points)
      const coinsToAward = Math.floor(score / 10) + 5;
      
      addCoins(coinsToAward, "Snake game completed");
      
      toast({
        title: "Snake game completed!",
        description: `You've earned ${coinsToAward} coins!`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving game results",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Games & Rewards</h1>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Games & Rewards</h1>
            <p className="text-muted-foreground">Play games, earn coins, and have fun!</p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
            <CoinsIcon className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">{user?.coins || 0}</span>
          </div>
        </div>

        {showTriviaGame ? (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Trivia Game</CardTitle>
                <Button variant="outline" onClick={() => setShowTriviaGame(false)}>
                  Exit Game
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TriviaGame onGameEnd={handleTriviaGameEnd} />
            </CardContent>
          </Card>
        ) : showSnakeGame ? (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Snake Game</CardTitle>
                <Button variant="outline" onClick={() => setShowSnakeGame(false)}>
                  Exit Game
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SnakeGame onGameEnd={handleSnakeGameEnd} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    Trivia Challenge
                  </CardTitle>
                  <CardDescription>Test your knowledge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>High Score: {progress.trivia.highScore}</span>
                    </div>
                    <div>Games Played: {progress.trivia.gamesPlayed}</div>
                  </div>
                  <p className="text-sm mb-4">
                    Answer trivia questions correctly to earn coins! The faster you answer, the more points you get.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setShowTriviaGame(true)}
                  >
                    Play Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    Snake Game
                  </CardTitle>
                  <CardDescription>Classic arcade fun</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>High Score: 0</span>
                    </div>
                    <div>Games Played: 0</div>
                  </div>
                  <p className="text-sm mb-4">
                    Control the snake to eat food and grow longer! Avoid hitting walls and yourself to score points.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setShowSnakeGame(true)}
                  >
                    Play Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Daily Reward
                  </CardTitle>
                  <CardDescription>Come back every day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <CoinsIcon className="h-4 w-4 text-yellow-500" />
                      <span>Reward: 25 coins</span>
                    </div>
                  </div>
                  <p className="text-sm mb-4">
                    Claim your daily reward to earn coins! Come back every day to increase your balance.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={claimDailyReward}
                    disabled={!hasDailyRewardAvailable}
                  >
                    {hasDailyRewardAvailable ? 'Claim Daily Reward' : 'Already Claimed Today'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>More Games Coming Soon!</CardTitle>
                <CardDescription>
                  We're working on adding more fun games and challenges for you to enjoy and earn coins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Have suggestions for games you'd like to see? Let us know!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Games;
