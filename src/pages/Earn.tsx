
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { useAchievements } from '@/context/AchievementContext';
import { Clock, Award, Gamepad2, CheckCircle, Coins, Gift, CheckCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Earn = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, addCoins } = useAuth();
  const { badges, userAchievements, earnBadge } = useAchievements();
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  
  const handleDailyRewardClaim = async () => {
    if (rewardLoading || dailyRewardClaimed || !addCoins) return;
    
    setRewardLoading(true);
    
    try {
      // Add coins for daily reward
      await addCoins(20, 'Daily reward');
      
      setDailyRewardClaimed(true);
      
      toast({
        title: "Daily Reward Claimed!",
        description: "You've received 20 coins as your daily reward."
      });
      
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      
      toast({
        title: "Failed to claim reward",
        description: "There was an issue claiming your daily reward.",
        variant: "destructive"
      });
    } finally {
      setRewardLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold mb-2">Earn Coins & Badges</h1>
            <p className="text-muted-foreground mb-6">Complete activities to earn coins and unlock badges</p>
          </motion.div>
          
          {/* Daily Reward Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent z-0 opacity-70"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      Daily Reward
                    </CardTitle>
                    <CardDescription>Claim your daily reward of 20 coins</CardDescription>
                  </div>
                  <Button 
                    onClick={handleDailyRewardClaim}
                    disabled={dailyRewardClaimed || rewardLoading}
                    className={cn(
                      "relative overflow-hidden",
                      dailyRewardClaimed && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {dailyRewardClaimed ? (
                      <>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Claimed
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Claim 20 Coins
                      </>
                    )}
                    {rewardLoading && (
                      <span className="absolute inset-0 flex items-center justify-center bg-primary">
                        Loading...
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm mb-4">Come back every day to claim more coins!</p>
                <div className="flex items-center text-sm">
                  <Coins className="h-4 w-4 mr-1 text-amber-500" />
                  <span>You currently have {user?.coins || 0} coins</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Achievements Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userAchievements.map(achievement => {
                const isCompleted = achievement.progress >= achievement.maxProgress;
                return (
                  <Card key={achievement.id} className={cn(
                    "border",
                    isCompleted ? "border-green-500/30" : "border-primary/10"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div>
                            <h3 className="font-medium">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="rounded-full bg-green-500/20 p-1">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {achievement.progress} / {achievement.maxProgress}</span>
                          {achievement.reward && (
                            <span className="text-amber-500 font-medium">Reward: {achievement.reward}</span>
                          )}
                        </div>
                        <Progress
                          value={(achievement.progress / achievement.maxProgress) * 100}
                          className={cn(
                            "h-2",
                            isCompleted ? "bg-green-200" : "bg-secondary/50"
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
          
          {/* Badges Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map(badge => {
                const earned = badge.earned;
                return (
                  <Card 
                    key={badge.id} 
                    className={cn(
                      "relative overflow-hidden border-2",
                      earned ? `border-${badge.backgroundColor}/50` : "border-muted"
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 opacity-20",
                      earned ? `bg-${badge.backgroundColor}/10` : "bg-muted/10"
                    )} />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                      {/* Badge icon */}
                      <div 
                        className={cn(
                          "text-4xl mb-2 p-3 rounded-full",
                          earned ? `text-${badge.color} bg-${badge.backgroundColor}/20` : "text-muted-foreground bg-muted/20"
                        )}
                      >
                        {badge.icon === 'admin' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                          </svg>
                        ) : (
                          badge.icon
                        )}
                      </div>
                      
                      {/* Badge name */}
                      <h3 className={cn(
                        "font-medium",
                        earned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {badge.name}
                      </h3>
                      
                      {/* Badge status */}
                      <div className="mt-2 flex items-center justify-center">
                        {earned ? (
                          <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" /> Earned
                          </span>
                        ) : (
                          <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" /> Locked
                          </span>
                        )}
                      </div>
                      
                      {/* Badge description */}
                      <p className="text-xs text-muted-foreground mt-2">{badge.description}</p>
                      
                      {/* Progress bar for badge (if applicable) */}
                      {!earned && badge.progressCurrent !== undefined && badge.progressTarget !== undefined && (
                        <div className="w-full mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{badge.progressCurrent}/{badge.progressTarget}</span>
                            <span>{Math.round((badge.progressCurrent / badge.progressTarget) * 100)}%</span>
                          </div>
                          <Progress
                            value={(badge.progressCurrent / badge.progressTarget) * 100}
                            className="h-1 bg-muted"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
          
          {/* Game Rewards Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Gamepad2 className="h-5 w-5 mr-2 text-primary" />
              Games & Activities
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Gamepad2 className="h-5 w-5 mr-2 text-emerald-500" />
                    Snake Game
                  </CardTitle>
                  <CardDescription>Earn up to 50 coins per game</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Score 20+: 5 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Score 50+: 25 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Score 100+: 50 coins</span>
                    </li>
                  </ul>
                  <Button onClick={() => navigate('/snake')} className="w-full">
                    Play Snake
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BrainIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Trivia Challenge
                  </CardTitle>
                  <CardDescription>Test your knowledge and earn coins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                      <span>40% correct: 10 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                      <span>60% correct: 30 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                      <span>80%+ correct: 50 coins</span>
                    </li>
                  </ul>
                  <Button onClick={() => navigate('/trivia')} className="w-full">
                    Play Trivia
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Award className="h-5 w-5 mr-2 text-amber-500" />
                    Complete Your Profile
                  </CardTitle>
                  <CardDescription>Earn coins by updating your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-500" />
                      <span>Add profile picture: 10 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-500" />
                      <span>Write a bio: 10 coins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-500" />
                      <span>Add school details: 20 coins</span>
                    </li>
                  </ul>
                  <Button onClick={() => navigate('/settings')} className="w-full">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

const BrainIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8.2A4 4 0 0 1 8.24 4.96a4.27 4.27 0 0 1 .32-1.93A4 4 0 0 1 6 .5a4 4 0 0 0 2.85 3.96A4 4 0 0 1 10 4.2a4 4 0 0 1 1.98.26 4.14 4.14 0 0 1 .32-1.91A3.95 3.95 0 0 1 9.72.28a4 4 0 0 0 4.56 0 3.95 3.95 0 0 1-2.58 2.27 4.14 4.14 0 0 1 .32 1.91A4 4 0 0 1 14 4.2a4 4 0 0 1 1.15.16A4 4 0 0 0 18 .5a4 4 0 0 1-2.56 2.53 4.27 4.27 0 0 1 .32 1.93A4 4 0 0 1 12 8.2Z"></path>
      <path d="M13.95 13.25a3.94 3.94 0 0 0-.2-1.3 4 4 0 0 0-7.5 0 3.94 3.94 0 0 0-.2 1.3 3.89 3.89 0 0 0 1.88 3.2c.38.18.78.32 1.2.4a3.95 3.95 0 0 0 1.74 0c.42-.08.82-.22 1.2-.4a3.89 3.89 0 0 0 1.88-3.2Z"></path>
      <path d="M18 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"></path>
      <path d="M6 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"></path>
      <path d="m12.7 19.71-.7 3.87a1 1 0 0 1-2 0l-.7-3.87a1.5 1.5 0 1 1 3.4 0Z"></path>
      <path d="m18.16 20.15 1.14 3.71a1 1 0 0 0 1.9-.58l-1.14-3.71a1.5 1.5 0 1 0-1.9.58Z"></path>
      <path d="m5.84 20.15-1.14 3.71a1 1 0 0 1-1.9-.58l1.14-3.71a1.5 1.5 0 1 1 1.9.58Z"></path>
    </svg>
  );
};

export default Earn;
