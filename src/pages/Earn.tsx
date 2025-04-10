
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Coins, Gift, Award, Share2, Clock, Calendar, Sparkles, UserPlus, PenSquare, ThumbsUp, Star, Trophy, EyeOff, MessageCircle } from 'lucide-react';

const Earn = () => {
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(1);
  const [totalEarned, setTotalEarned] = useState(0);
  const [tasks, setTasks] = useState({
    daily: { completed: 0, total: 4 },
    social: { completed: 0, total: 4 },
    challenges: { completed: 0, total: 3 }
  });
  
  // Fetch user's coins data
  useEffect(() => {
    const checkDailyReward = async () => {
      if (!user) return;
      
      try {
        // Check if user has claimed daily reward today
        const today = new Date().toISOString().split('T')[0];
        const { data: rewards } = await supabase
          .from('daily_rewards')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);
          
        setDailyRewardClaimed(rewards && rewards.length > 0);
        
        // Get daily streak (this would require additional logic)
        // For demo purposes, we'll use a random number between 1-14
        setDailyStreak(Math.floor(Math.random() * 14) + 1);
        
        // Get total coins earned
        const { data: totalCoins } = await supabase
          .from('daily_rewards')
          .select('coins_rewarded')
          .eq('user_id', user.id);
          
        const sum = totalCoins?.reduce((acc, curr) => acc + curr.coins_rewarded, 0) || 0;
        setTotalEarned(sum);
        
        // Get completed tasks
        const { data: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
          
        const { data: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
          
        setTasks(prev => ({
          ...prev,
          daily: {
            ...prev.daily,
            completed: (dailyRewardClaimed ? 1 : 0) + 
              ((postsCount && postsCount.length > 0) ? 1 : 0) +
              ((commentsCount && commentsCount.length > 0) ? 1 : 0)
          },
          social: {
            ...prev.social,
            completed: ((postsCount && postsCount.length >= 3) ? 1 : 0) +
              ((commentsCount && commentsCount.length >= 3) ? 1 : 0) + 
              Math.min(1, Math.floor((user.coins || 0) / 100))
          }
        }));
      } catch (error) {
        console.error('Error checking daily reward:', error);
      }
    };
    
    checkDailyReward();
  }, [user, dailyRewardClaimed]);
  
  const claimDailyReward = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'You need to be logged in to claim rewards',
        variant: 'destructive',
      });
      return;
    }
    
    if (dailyRewardClaimed) {
      toast({
        title: 'Already claimed',
        description: 'You have already claimed your daily reward today',
        variant: 'destructive',
      });
      return;
    }
    
    setLoadingDaily(true);
    
    try {
      const coinsToAward = 25 + (dailyStreak >= 7 ? 15 : 0);
      
      // Insert daily reward record
      const { error } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: coinsToAward
        });
        
      if (error) throw error;
      
      // Update user's coins
      const updatedCoins = (user.coins || 0) + coinsToAward;
      await updateUserData({ coins: updatedCoins });
      
      // Update state
      setDailyRewardClaimed(true);
      setCoinsEarned(coinsToAward);
      setTasks(prev => ({
        ...prev,
        daily: {
          ...prev.daily,
          completed: prev.daily.completed + 1
        }
      }));
      
      // Show toast
      toast({
        title: 'Daily reward claimed!',
        description: `You've earned ${coinsToAward} coins. Current streak: ${dailyStreak} days`,
      });
    } catch (error: any) {
      toast({
        title: 'Error claiming reward',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoadingDaily(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex flex-col gap-8">
          {/* Header section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Earn Coins</h1>
            <p className="text-muted-foreground mt-2">Complete activities to earn coins and unlock perks</p>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center">
                  <Coins className="mr-2 h-5 w-5 text-yellow-500" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-0">
                <div className="text-4xl font-bold text-yellow-500">{user?.coins || 0}</div>
                <p className="text-muted-foreground text-sm mt-1">Available coins</p>
              </CardContent>
              <CardFooter className="justify-center pt-4 pb-4">
                <Button onClick={() => navigate("/games")} variant="outline" size="sm">
                  Spend Coins
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  Daily Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-0">
                <div className="text-4xl font-bold text-blue-500">{dailyStreak}</div>
                <p className="text-muted-foreground text-sm mt-1">Days in a row</p>
              </CardContent>
              <CardFooter className="justify-center pt-4 pb-4">
                <Badge variant="outline" className="px-2">
                  {dailyStreak >= 7 ? '7+ days: +15 bonus coins' : 'Get +15 coins at 7 days'}
                </Badge>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center">
                  <Award className="mr-2 h-5 w-5 text-green-500" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-0">
                <div className="text-4xl font-bold text-green-500">{totalEarned + (user?.coins || 0)}</div>
                <p className="text-muted-foreground text-sm mt-1">Lifetime coins</p>
              </CardContent>
              <CardFooter className="justify-center pt-4 pb-4">
                <Badge variant={totalEarned > 1000 ? "default" : "outline"} className="px-2">
                  {totalEarned > 1000 ? 'Power Earner' : 'Earn 1000+ for Power Earner badge'}
                </Badge>
              </CardFooter>
            </Card>
          </div>
          
          {/* Daily reward card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
              <CardTitle className="flex items-center">
                <Gift className="mr-2 h-5 w-5 text-yellow-500" />
                Daily Reward
              </CardTitle>
              <CardDescription>
                Claim your daily reward once every 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative">
                  <motion.div
                    className="w-36 h-36 flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-800/30 rounded-full border-4 border-dashed border-yellow-300 dark:border-yellow-700"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <div className="text-center">
                      <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                        {dailyStreak >= 7 ? '40' : '25'}
                      </div>
                      <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1">
                        COINS
                      </div>
                    </div>
                  </motion.div>
                  {dailyRewardClaimed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full backdrop-blur-sm">
                      <CheckCircle2 className="h-14 w-14 text-green-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">Daily Login Bonus</h3>
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Day {dailyStreak} Streak</span>
                        <span>{dailyStreak} / 7</span>
                      </div>
                      <Progress value={(dailyStreak / 7) * 100} className="h-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {dailyStreak >= 7 
                        ? 'You get +15 bonus coins for maintaining a 7+ day streak!' 
                        : `Maintain your daily streak for ${7 - dailyStreak} more day${dailyStreak === 6 ? '' : 's'} to earn bonus coins!`}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={claimDailyReward}
                    disabled={dailyRewardClaimed || loadingDaily} 
                    className="w-full md:w-auto"
                  >
                    {loadingDaily ? (
                      <>Loading...</>
                    ) : dailyRewardClaimed ? (
                      <>Already Claimed Today</>
                    ) : (
                      <>Claim {dailyStreak >= 7 ? '40' : '25'} Coins</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <motion.div 
              className={`px-6 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800/30 ${
                coinsEarned ? 'block' : 'hidden'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span>You've earned {coinsEarned} coins today!</span>
              </div>
            </motion.div>
          </Card>
          
          {/* Ways to earn */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Ways to Earn</h2>
            
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
                <TabsTrigger value="social">Social Tasks</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily">
                <div className="grid gap-4">
                  <div className="flex items-center">
                    <div className="w-full max-w-xs">
                      <Progress value={(tasks.daily.completed / tasks.daily.total) * 100} className="h-2" />
                    </div>
                    <span className="ml-4 text-sm font-medium">
                      {tasks.daily.completed}/{tasks.daily.total} Completed
                    </span>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full ${dailyRewardClaimed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'}`}>
                              <Gift className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Claim daily reward</p>
                              <p className="text-sm text-muted-foreground">Claim your daily coin bonus</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">25 coins</Badge>
                            {dailyRewardClaimed && <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />}
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <PenSquare className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Create a post</p>
                              <p className="text-sm text-muted-foreground">Share something with the community</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">10 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Comment on a post</p>
                              <p className="text-sm text-muted-foreground">Engage with other users</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">5 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <UserPlus className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Add a new friend</p>
                              <p className="text-sm text-muted-foreground">Connect with someone new</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">15 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/add-friends')}>
                              Go
                            </Button>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="social">
                <div className="grid gap-4">
                  <div className="flex items-center">
                    <div className="w-full max-w-xs">
                      <Progress value={(tasks.social.completed / tasks.social.total) * 100} className="h-2" />
                    </div>
                    <span className="ml-4 text-sm font-medium">
                      {tasks.social.completed}/{tasks.social.total} Completed
                    </span>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <PenSquare className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Create 3 posts</p>
                              <p className="text-sm text-muted-foreground">Share your thoughts with others</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">30 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Comment on 3 posts</p>
                              <p className="text-sm text-muted-foreground">Engage with the community</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">15 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <Share2 className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Share a post</p>
                              <p className="text-sm text-muted-foreground">Share interesting content</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">20 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <ThumbsUp className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Get 10 likes</p>
                              <p className="text-sm text-muted-foreground">Create engaging content</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">50 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                              Go
                            </Button>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="challenges">
                <div className="grid gap-4">
                  <div className="flex items-center">
                    <div className="w-full max-w-xs">
                      <Progress value={(tasks.challenges.completed / tasks.challenges.total) * 100} className="h-2" />
                    </div>
                    <span className="ml-4 text-sm font-medium">
                      {tasks.challenges.completed}/{tasks.challenges.total} Completed
                    </span>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Play Snake game</p>
                              <p className="text-sm text-muted-foreground">Get a high score in Snake</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">30 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/games/snake')}>
                              Play
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <Star className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Complete Trivia</p>
                              <p className="text-sm text-muted-foreground">Answer trivia questions</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">25 coins</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/games/trivia')}>
                              Play
                            </Button>
                          </div>
                        </li>
                        
                        <li className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-muted">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">7 day streak</p>
                              <p className="text-sm text-muted-foreground">Login for 7 days in a row</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">100 coins</Badge>
                            <Badge variant={dailyStreak >= 7 ? "success" : "secondary"}>
                              {dailyStreak}/7 days
                            </Badge>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <Separator />
          
          {/* Achievements */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2 pt-6">
                  <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                  <CardTitle className="text-center">Social Star</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">Make 50 friends</p>
                </CardContent>
                <CardFooter className="pt-0 justify-center pb-6">
                  <Badge variant="outline">500 coins</Badge>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader className="pb-2 pt-6">
                  <Star className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                  <CardTitle className="text-center">Content Creator</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">Create 100 posts</p>
                </CardContent>
                <CardFooter className="pt-0 justify-center pb-6">
                  <Badge variant="outline">1000 coins</Badge>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader className="pb-2 pt-6">
                  <Award className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <CardTitle className="text-center">Dedicated User</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">30 day login streak</p>
                </CardContent>
                <CardFooter className="pt-0 justify-center pb-6">
                  <Badge variant="outline">2000 coins</Badge>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
