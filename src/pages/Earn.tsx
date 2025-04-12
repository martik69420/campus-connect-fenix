
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { Coins, Gift, Clock, ArrowRight, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  image: string;
  type: 'digital' | 'physical' | 'discount';
  available: boolean;
}

interface DailyReward {
  id?: string;
  created_at?: string;
  coins_rewarded: number;
}

const EarnPage: React.FC = () => {
  const { user, addCoins, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    loadRewards();
    checkDailyReward();
  }, [user?.id]);
  
  const loadRewards = () => {
    setIsLoading(true);
    // Mock data - in a real app, fetch from API
    const mockRewards: Reward[] = [
      {
        id: '1',
        name: 'Amazon Gift Card',
        description: '$10 Amazon Gift Card',
        cost: 5000,
        image: 'https://placehold.co/300x200?text=Amazon+Card',
        type: 'digital',
        available: true
      },
      {
        id: '2',
        name: 'Spotify Premium',
        description: '1 Month Subscription',
        cost: 3000,
        image: 'https://placehold.co/300x200?text=Spotify',
        type: 'digital',
        available: true
      },
      {
        id: '3',
        name: 'Netflix Subscription',
        description: '1 Month Basic Plan',
        cost: 4000,
        image: 'https://placehold.co/300x200?text=Netflix',
        type: 'digital',
        available: true
      },
      {
        id: '4',
        name: 'Campus Merch',
        description: 'T-shirt with logo',
        cost: 8000,
        image: 'https://placehold.co/300x200?text=Campus+Merch',
        type: 'physical',
        available: true
      },
      {
        id: '5',
        name: 'Food Discount',
        description: '20% off at campus cafeteria',
        cost: 2000,
        image: 'https://placehold.co/300x200?text=Food+Discount',
        type: 'discount',
        available: true
      },
      {
        id: '6',
        name: 'Premium Badge',
        description: 'Exclusive profile badge',
        cost: 1000,
        image: 'https://placehold.co/300x200?text=Premium+Badge',
        type: 'digital',
        available: true
      }
    ];
    
    setRewards(mockRewards);
    setIsLoading(false);
  };
  
  const checkDailyReward = async () => {
    if (!user?.id) return;
    
    try {
      // Check if user has claimed today's reward
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: dailyRewards, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (dailyRewards && dailyRewards.length > 0) {
        setDailyRewardClaimed(true);
        setDailyRewardAmount(dailyRewards[0].coins_rewarded);
      } else {
        setDailyRewardClaimed(false);
        
        // Calculate today's reward amount (e.g., based on streak)
        // In a real app, you'd calculate this based on user's login streak
        // For now, use a random amount between 50-100
        setDailyRewardAmount(Math.floor(Math.random() * 51) + 50);
      }
    } catch (error) {
      console.error("Error checking daily reward:", error);
    }
  };
  
  const claimDailyReward = async () => {
    if (!user?.id || dailyRewardClaimed) return;
    
    try {
      // Add reward to user's coins
      const success = await addCoins(dailyRewardAmount, 'Daily login reward');
      
      if (success) {
        // Record the daily reward claim
        const { error } = await supabase
          .from('daily_rewards')
          .insert([{ user_id: user.id, coins_rewarded: dailyRewardAmount }]);
          
        if (error) throw error;
        
        setDailyRewardClaimed(true);
        toast({
          title: 'Reward Claimed!',
          description: `You've received ${dailyRewardAmount} coins as your daily reward.`
        });
        
        // Refresh user data to show updated coins
        await refreshUser();
      } else {
        throw new Error('Failed to add coins');
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      toast({
        title: 'Error',
        description: 'Failed to claim your daily reward. Please try again later.',
        variant: 'destructive'
      });
    }
  };
  
  const handleRedeemReward = async (reward: Reward) => {
    if (!user) return;
    
    setSelectedReward(reward);
  };
  
  const confirmRedemption = async () => {
    if (!user || !selectedReward) return;
    
    setIsRedeeming(true);
    
    try {
      // Check if user has enough coins
      if ((user.coins || 0) < selectedReward.cost) {
        toast({
          title: 'Not Enough Coins',
          description: `You need ${selectedReward.cost - (user.coins || 0)} more coins to redeem this reward.`,
          variant: 'destructive'
        });
        setIsRedeeming(false);
        return;
      }
      
      // In a real app, integrate with a proper reward system
      // For now, just deduct coins
      const { data, error } = await supabase
        .from('profiles')
        .update({ coins: (user.coins || 0) - selectedReward.cost })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh user data
      await refreshUser();
      
      toast({
        title: 'Reward Redeemed!',
        description: `You've successfully redeemed the ${selectedReward.name}.`
      });
      
      // Close dialog and reset state
      setSelectedReward(null);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast({
        title: 'Error',
        description: 'Failed to redeem reward. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="grid gap-6">
          {/* Header with coin balance */}
          <Card className="bg-gradient-to-br from-primary/80 to-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-primary-foreground mb-4">
                <div>
                  <h2 className="text-3xl font-bold">Earn & Redeem</h2>
                  <p className="opacity-90">Complete tasks to earn coins and redeem rewards</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Coins className="h-6 w-6" />
                    <span className="text-2xl font-bold">{user?.coins || 0}</span>
                  </div>
                  <p className="opacity-90">Your Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Reward */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Reward
              </CardTitle>
              <CardDescription>
                Login every day to earn coins and increase your streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyRewardClaimed ? (
                <Alert>
                  <CheckCircle className="h-5 w-5" />
                  <AlertTitle>Daily reward claimed!</AlertTitle>
                  <AlertDescription>
                    You've already claimed today's reward of {dailyRewardAmount} coins.
                    Come back tomorrow for more!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
                      <Gift className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Daily Login Bonus</h3>
                      <p className="text-sm text-muted-foreground">
                        {dailyRewardAmount} coins are waiting for you!
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={claimDailyReward} 
                    className="min-w-[120px]"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Claim Reward
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Available Rewards
              </CardTitle>
              <CardDescription>
                Redeem your coins for these exciting rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  // Loading skeleton
                  Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="border opacity-70">
                      <div className="h-40 bg-muted animate-pulse"></div>
                      <CardContent className="p-4">
                        <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                        <div className="h-4 w-full bg-muted animate-pulse rounded mb-3"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                          <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-[3/2] overflow-hidden">
                          <img
                            src={reward.image}
                            alt={reward.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{reward.name}</h3>
                            <Badge variant={reward.type === 'physical' ? 'outline' : 'default'}>
                              {reward.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {reward.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-amber-500" />
                              <span className="font-bold">{reward.cost}</span>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  disabled={(user?.coins || 0) < reward.cost}
                                  onClick={() => setSelectedReward(reward)}
                                >
                                  Redeem
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Redeem Reward</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to redeem this reward?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-4 py-4">
                                  <img 
                                    src={selectedReward?.image} 
                                    alt={selectedReward?.name} 
                                    className="w-24 h-24 object-cover rounded"
                                  />
                                  <div>
                                    <h3 className="font-medium">{selectedReward?.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedReward?.description}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                      <Coins className="h-4 w-4 text-amber-500" />
                                      <span className="font-bold">{selectedReward?.cost}</span>
                                    </div>
                                  </div>
                                </div>
                                <Separator />
                                <div className="py-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Your balance:</span>
                                    <span>{user?.coins || 0} coins</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Cost:</span>
                                    <span>{selectedReward?.cost} coins</span>
                                  </div>
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-medium">
                                    <span>Remaining:</span>
                                    <span>{Math.max(0, (user?.coins || 0) - (selectedReward?.cost || 0))} coins</span>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setSelectedReward(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={confirmRedemption}
                                    disabled={isRedeeming || (user?.coins || 0) < (selectedReward?.cost || 0)}
                                  >
                                    {isRedeeming ? "Processing..." : "Confirm Redemption"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* How to earn more coins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                How to Earn More Coins
              </CardTitle>
              <CardDescription>
                Complete these activities to increase your coin balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Create Posts</h3>
                    <p className="text-sm text-muted-foreground">10 coins per post</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/">
                      Post Now <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Complete Daily Login</h3>
                    <p className="text-sm text-muted-foreground">{dailyRewardAmount} coins per day</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={dailyRewardClaimed} 
                    onClick={claimDailyReward}
                  >
                    {dailyRewardClaimed ? "Claimed" : "Claim"}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Unlock Achievements</h3>
                    <p className="text-sm text-muted-foreground">50-1000 coins per achievement</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/achievements">
                      View Achievements <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Play Games</h3>
                    <p className="text-sm text-muted-foreground">Earn coins based on your performance</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/games">
                      Play Games <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default EarnPage;
