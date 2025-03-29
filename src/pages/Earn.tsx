import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gift, Trophy, Award, CoinsIcon, GamepadIcon, Users, LucideIcon, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';

interface EarnTask {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  coinsReward: number;
  completionCriteria: string;
  isCompleted: boolean;
  progress: number;
  target: number;
  route: string;
}

const Earn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading, addCoins } = useAuth();
  const { hasDailyRewardAvailable, claimDailyReward, lastRewardClaimed } = useGame();
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastClaimedDate, setLastClaimedDate] = useState<Date | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Load daily streak from local storage
  useEffect(() => {
    if (user) {
      // Load streak data
      const storedStreak = localStorage.getItem(`streak_${user.id}`);
      const storedDate = localStorage.getItem(`lastClaimed_${user.id}`);
      
      if (storedStreak) {
        setDailyStreak(parseInt(storedStreak));
      }
      
      if (storedDate) {
        setLastClaimedDate(new Date(storedDate));
      }
    }
  }, [user]);
  
  // Check if streak is broken (more than 48 hours since last claim)
  useEffect(() => {
    if (lastClaimedDate && user) {
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setHours(now.getHours() - 48);
      
      if (lastClaimedDate < twoDaysAgo) {
        // Reset streak if more than 48 hours have passed
        setDailyStreak(0);
        localStorage.setItem(`streak_${user.id}`, '0');
      }
    }
  }, [lastClaimedDate, user]);
  
  // Sample tasks
  const earnTasks: EarnTask[] = [
    {
      id: 'daily',
      title: t('earn.dailyLogin'),
      description: t('earn.dailyLoginDesc'),
      icon: Calendar,
      coinsReward: 25,
      completionCriteria: t('earn.completionOnce'),
      isCompleted: !hasDailyRewardAvailable,
      progress: hasDailyRewardAvailable ? 0 : 1,
      target: 1,
      route: '/'
    },
    {
      id: 'games',
      title: t('earn.playGames'),
      description: t('earn.playGamesDesc'),
      icon: GamepadIcon,
      coinsReward: 50,
      completionCriteria: t('earn.gameCompletion'),
      isCompleted: false,
      progress: 0,
      target: 3,
      route: '/games'
    },
    {
      id: 'friends',
      title: t('earn.inviteFriends'),
      description: t('earn.inviteFriendsDesc'),
      icon: Users,
      coinsReward: 100,
      completionCriteria: t('earn.perFriend'),
      isCompleted: false,
      progress: 0,
      target: 5,
      route: '/add-friends'
    },
    {
      id: 'leaderboard',
      title: t('earn.reachTop10'),
      description: t('earn.reachTop10Desc'),
      icon: Trophy,
      coinsReward: 500,
      completionCriteria: t('earn.oneTime'),
      isCompleted: false,
      progress: 0,
      target: 1,
      route: '/leaderboard'
    }
  ];
  
  // Claim daily reward with streak
  const handleClaimDailyReward = async () => {
    if (!user) return;
    
    setIsClaiming(true);
    
    try {
      if (hasDailyRewardAvailable) {
        // Calculate streak bonus
        const newStreak = dailyStreak + 1;
        const streakBonus = Math.min(Math.floor(newStreak / 5) * 5, 25); // 5 coins per 5 days, max 25
        const totalReward = 25 + streakBonus;
        
        // Claim basic reward
        const claimed = claimDailyReward();
        
        if (claimed) {
          // Add streak bonus separately if streak > 1
          if (newStreak > 1 && streakBonus > 0) {
            addCoins(streakBonus);
            
            toast({
              title: t('earn.streakBonus'),
              description: t('earn.streakBonusDesc', { days: newStreak.toString(), bonus: streakBonus.toString() }),
            });
          }
          
          // Save streak data
          setDailyStreak(newStreak);
          const now = new Date();
          setLastClaimedDate(now);
          
          // Save to local storage
          localStorage.setItem(`streak_${user.id}`, newStreak.toString());
          localStorage.setItem(`lastClaimed_${user.id}`, now.toISOString());
          
          // Save streak to database 
          try {
            await supabase.from('daily_rewards').insert({
              user_id: user.id,
              coins_rewarded: totalReward
            });
          } catch (err) {
            console.error("Error saving streak to database:", err);
          }
        }
      } else {
        toast({
          title: t('earn.alreadyClaimed'),
          description: t('earn.comeBackTomorrow'),
          variant: "destructive",
        });
      }
    } finally {
      setIsClaiming(false);
    }
  };
  
  const getTimeUntilNextReward = () => {
    if (!lastClaimedDate) return null;
    
    const now = new Date();
    const nextRewardTime = new Date(lastClaimedDate);
    nextRewardTime.setDate(nextRewardTime.getDate() + 1);
    
    const diff = nextRewardTime.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  const nextRewardTime = getTimeUntilNextReward();
  
  // Animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">{t('earn.earnCoins')}</h1>
        <p className="text-muted-foreground mb-8">{t('earn.earnCoinsDesc')}</p>
        
        {/* Daily Streak Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-amber-800 dark:text-amber-300">
                <Award className="mr-2 h-5 w-5" />
                {t('earn.dailyStreak')}
                {dailyStreak > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                    {dailyStreak} {t('earn.days')}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{t('earn.streakDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center ${i < dailyStreak % 7 ? 'bg-amber-400 text-amber-950 dark:bg-amber-500' : 'bg-amber-100 text-amber-400 dark:bg-amber-800/40 dark:text-amber-600'} font-medium`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {dailyStreak >= 5 && (
                <div className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                  <span className="font-medium">+{Math.min(Math.floor(dailyStreak / 5) * 5, 25)} {t('earn.coinsPerDay')}</span> - {t('earn.streakBonusText')}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <Button 
                  onClick={handleClaimDailyReward} 
                  disabled={!hasDailyRewardAvailable || isClaiming}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isClaiming ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      {t('common.loading')}
                    </span>
                  ) : hasDailyRewardAvailable ? (
                    <span className="flex items-center">
                      <Gift className="mr-2 h-4 w-4" />
                      {t('earn.claimDaily')} (+25 {t('common.coins')})
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {nextRewardTime ? `${t('earn.nextReward')}: ${nextRewardTime}` : t('earn.checkBackTomorrow')}
                    </span>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
        
        {/* Earn Tasks */}
        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-2xl font-bold mb-4">{t('earn.ways')}</h2>
          
          {earnTasks.map((task) => (
            <motion.div key={task.id} variants={item}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="mr-4 p-2 bg-primary/10 rounded-lg">
                        <task.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center">
                      <CoinsIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      {task.coinsReward}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <div>{task.completionCriteria}</div>
                    <div className="font-medium">{task.progress}/{task.target}</div>
                  </div>
                  <Progress
                    value={(task.progress / task.target) * 100}
                    className="h-2"
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    variant={task.isCompleted ? "outline" : "default"}
                    className="w-full"
                    onClick={() => navigate(task.route)}
                    disabled={task.isCompleted}
                  >
                    {task.isCompleted ? t('earn.completed') : t('earn.goTo')}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Earn;
