
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TriviaGame from '@/components/game/TriviaGame';
import { BrainCircuit, Calendar, CoinsIcon, Gift, Trophy } from 'lucide-react';

const Games = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTriviaGame, setShowTriviaGame] = useState(false);
  const [lastDailyReward, setLastDailyReward] = useState<Date | null>(null);
  const [highScores, setHighScores] = useState<{
    triviaHighScore: number;
    triviaGamesPlayed: number;
  }>({
    triviaHighScore: 0,
    triviaGamesPlayed: 0,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      fetchUserData(session.user.id);
    };
    
    checkUser();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setProfile(profile);
      
      // Fetch last daily reward
      const { data: dailyRewards, error: rewardsError } = await supabase
        .from('daily_rewards')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (dailyRewards && dailyRewards.length > 0) {
        setLastDailyReward(new Date(dailyRewards[0].created_at));
      }
      
      // Fetch game history
      const { data: gameHistory, error: gameError } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .eq('game_type', 'trivia');
      
      if (gameHistory && gameHistory.length > 0) {
        const highScore = Math.max(...gameHistory.map(game => game.score));
        setHighScores({
          triviaHighScore: highScore,
          triviaGamesPlayed: gameHistory.length,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canClaimDaily = () => {
    if (!lastDailyReward) return true;
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return lastDailyReward < yesterday;
  };

  const claimDailyReward = async () => {
    if (!user || !canClaimDaily()) return;
    
    try {
      // Add coins to user's balance
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ coins: profile.coins + 25 })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Record the reward claim
      await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: 25,
        });
      
      // Update local state
      setProfile(updateData);
      setLastDailyReward(new Date());
      
      toast({
        title: "Daily reward claimed!",
        description: "You've received 25 coins",
      });
    } catch (error: any) {
      toast({
        title: "Failed to claim reward",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGameEnd = async (score: number) => {
    if (!user) return;
    
    try {
      // Record game history
      await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: 'trivia',
          score,
        });
      
      // Check if it's a new high score
      if (score > highScores.triviaHighScore) {
        // Award coins for new high score
        const coinsToAward = score * 2;
        
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ coins: profile.coins + coinsToAward })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        setProfile(updateData);
        
        toast({
          title: "New high score!",
          description: `You've earned ${coinsToAward} coins!`,
        });
      } else {
        // Award some coins for playing
        const coinsToAward = Math.floor(score / 2);
        
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ coins: profile.coins + coinsToAward })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        setProfile(updateData);
        
        toast({
          title: "Game completed!",
          description: `You've earned ${coinsToAward} coins!`,
        });
      }
      
      // Update high scores locally
      setHighScores({
        triviaHighScore: Math.max(score, highScores.triviaHighScore),
        triviaGamesPlayed: highScores.triviaGamesPlayed + 1,
      });
    } catch (error: any) {
      toast({
        title: "Error saving game results",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
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
            <span className="font-bold">{profile?.coins || 0}</span>
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
              <TriviaGame onGameEnd={handleGameEnd} />
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
                      <span>High Score: {highScores.triviaHighScore}</span>
                    </div>
                    <div>Games Played: {highScores.triviaGamesPlayed}</div>
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
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {lastDailyReward 
                          ? `Last claimed: ${new Date(lastDailyReward).toLocaleDateString()}` 
                          : 'Not claimed yet'}
                      </span>
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
                    disabled={!canClaimDaily()}
                  >
                    {canClaimDaily() ? 'Claim Daily Reward' : 'Already Claimed Today'}
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
