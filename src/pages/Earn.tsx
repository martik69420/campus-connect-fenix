
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { CheckCircle, Coins, Award, Trophy, Calendar, CheckCircle2, Users, MessageSquare, Gamepad2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Earn = () => {
  const { toast } = useToast();
  const { user, addCoins } = useAuth();
  
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  
  const tasks = [
    {
      id: 'create-post',
      title: 'Create a post',
      description: 'Share something with your campus community',
      reward: 10,
      icon: MessageSquare,
      completionRate: 0
    },
    {
      id: 'add-friend',
      title: 'Add a friend',
      description: 'Connect with someone from your school',
      reward: 20,
      icon: UserPlus,
      completionRate: 0
    },
    {
      id: 'play-game',
      title: 'Play a game',
      description: 'Play any game in the Games section',
      reward: 15,
      icon: Gamepad2,
      completionRate: 0
    },
    {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Fill out all fields in your profile',
      reward: 30,
      icon: CheckCircle2,
      completionRate: user?.bio !== undefined ? 100 : 0
    },
    {
      id: 'invite-friend',
      title: 'Invite a friend',
      description: 'Invite a friend to join Campus Fenix',
      reward: 50,
      icon: Users,
      completionRate: 0
    },
  ];
  
  const achievements = [
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Add 5 friends to your network',
      progress: 0,
      total: 5,
      reward: 100,
      icon: Users
    },
    {
      id: 'content-creator',
      title: 'Content Creator',
      description: 'Create 10 posts',
      progress: 0,
      total: 10,
      reward: 150,
      icon: MessageSquare
    },
    {
      id: 'game-master',
      title: 'Game Master',
      description: 'Score 1000 points in games',
      progress: 0,
      total: 1000,
      reward: 200,
      icon: Trophy
    }
  ];
  
  const handleClaimDailyReward = async () => {
    if (!user) return;
    
    try {
      // Check if already claimed today
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingReward, error: checkError } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
        
      if (checkError) {
        console.error("Check daily reward error:", checkError);
        throw checkError;
      }
      
      if (existingReward && existingReward.length > 0) {
        toast({
          title: "Already claimed",
          description: "You've already claimed your daily reward today",
          variant: "destructive"
        });
        return;
      }
      
      // Add reward record
      const coinsAmount = 25; // Daily reward amount
      
      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          coins_rewarded: coinsAmount
        });
        
      if (rewardError) {
        console.error("Add daily reward error:", rewardError);
        throw rewardError;
      }
      
      // Update user coins
      addCoins(coinsAmount, "Daily login reward");
      
      setDailyRewardClaimed(true);
      
      toast({
        title: "Daily reward claimed!",
        description: `You've earned ${coinsAmount} coins for logging in today!`,
      });
      
    } catch (error: any) {
      console.error("Daily reward error:", error);
      toast({
        title: "Failed to claim reward",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleCompleteTask = (taskId: string, reward: number) => {
    if (completedTasks[taskId]) return;
    
    // In a real app, verify task completion
    
    // Mark task as completed
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: true
    }));
    
    // Add coins
    addCoins(reward, `Task completed: ${taskId}`);
    
    toast({
      title: "Task completed!",
      description: `You earned ${reward} coins!`,
    });
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Earn Coins</h1>
            <p className="text-muted-foreground">Complete tasks and earn coins to unlock rewards</p>
          </div>
          <div className="flex items-center bg-card border rounded-lg p-3 shadow-sm">
            <Coins className="h-6 w-6 text-yellow-500 mr-2" />
            <div>
              <div className="text-xl font-bold">{user?.coins || 0}</div>
              <div className="text-xs text-muted-foreground">Your coins</div>
            </div>
          </div>
        </div>
        
        {/* Daily Reward */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Daily Reward</CardTitle>
            <CardDescription>Claim your daily coins just for logging in</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-lg mr-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Login Reward</h3>
                  <p className="text-sm text-muted-foreground">Log in every day to earn coins</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-500">+25</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleClaimDailyReward} 
              disabled={dailyRewardClaimed}
            >
              {dailyRewardClaimed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Claimed
                </>
              ) : (
                'Claim Reward'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tasks */}
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <task.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                    </div>
                    <div className="text-xl font-bold text-yellow-500">+{task.reward}</div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                  <Progress value={task.completionRate} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={completedTasks[task.id] ? "secondary" : "outline"} 
                    className="w-full"
                    onClick={() => handleCompleteTask(task.id, task.reward)}
                    disabled={completedTasks[task.id] || task.completionRate < 100}
                  >
                    {completedTasks[task.id] ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Completed
                      </>
                    ) : task.completionRate >= 100 ? (
                      'Claim Reward'
                    ) : (
                      'In Progress'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Achievements */}
        <h2 className="text-2xl font-bold mb-4">Achievements</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <motion.div 
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <achievement.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    </div>
                    <div className="text-xl font-bold text-yellow-500">+{achievement.reward}</div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.total}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.total) * 100} 
                    className="h-2" 
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={achievement.progress < achievement.total}
                  >
                    {achievement.progress >= achievement.total ? 'Claim Reward' : 'In Progress'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
