
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Trophy, Star, Clock, GiftIcon, Coins } from "lucide-react";

// Define the reward types
interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  image: string;
  available: boolean;
  category: "gift-card" | "digital" | "physical" | "exclusive";
}

const Earn = () => {
  const { user, addCoins } = useAuth();
  const { toast } = useToast();
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [lastClaimedDaily, setLastClaimedDaily] = useState<Date | null>(null);
  
  // Claim daily reward
  const claimDailyReward = async () => {
    if (!user) return;
    
    setIsClaimingDaily(true);
    try {
      // In a real app, you would check server-side if the user has already claimed today
      const success = await addCoins(10, "Daily login reward");
      
      if (success) {
        setLastClaimedDaily(new Date());
        toast({
          title: "Daily Reward Claimed!",
          description: "You've earned 10 coins for logging in today.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not claim daily reward. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsClaimingDaily(false);
    }
  };
  
  // Example rewards data
  const rewards: Reward[] = [
    {
      id: "1",
      name: "5€ Amazon Gift Card",
      description: "Redeem for a 5€ Amazon gift card code",
      cost: 500,
      image: "/placeholder.svg",
      available: true,
      category: "gift-card"
    },
    {
      id: "2",
      name: "10€ Google Play Gift Card",
      description: "Redeem for a 10€ Google Play gift card code",
      cost: 1000,
      image: "/placeholder.svg",
      available: true,
      category: "gift-card"
    },
    {
      id: "3",
      name: "Campus Fenix T-shirt",
      description: "Show your school spirit with this exclusive t-shirt",
      cost: 2500,
      image: "/placeholder.svg",
      available: true,
      category: "physical"
    },
    {
      id: "4",
      name: "Premium Membership (1 month)",
      description: "Upgrade to premium for exclusive features",
      cost: 1500,
      image: "/placeholder.svg",
      available: true,
      category: "digital"
    },
    {
      id: "5",
      name: "Custom Profile Badge",
      description: "Add a unique badge to your profile",
      cost: 750,
      image: "/placeholder.svg",
      available: true,
      category: "exclusive"
    },
  ];
  
  // Filter rewards by category
  const filterRewardsByCategory = (category: string) => {
    if (category === "all") return rewards;
    return rewards.filter(reward => reward.category === category);
  };

  const canRedeemReward = (cost: number) => {
    return user && user.coins >= cost;
  };
  
  const handleRedeemReward = (reward: Reward) => {
    if (!canRedeemReward(reward.cost)) {
      toast({
        title: "Not enough coins",
        description: `You need ${reward.cost - (user?.coins || 0)} more coins to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }
    
    // Here you would make an API call to process the redemption
    toast({
      title: "Redemption requested",
      description: `Your request for ${reward.name} has been submitted.`,
    });
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-6">
          {/* Coin balance card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Balance</h2>
                  <div className="flex items-center mt-2">
                    <Coins className="h-6 w-6 text-yellow-500 mr-2" />
                    <span className="text-3xl font-bold">{user?.coins || 0}</span>
                    <span className="ml-2 text-muted-foreground">coins</span>
                  </div>
                </div>
                <Button onClick={claimDailyReward} disabled={isClaimingDaily || !!lastClaimedDaily}>
                  {isClaimingDaily ? "Claiming..." : "Claim Daily Reward"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Ways to earn coins */}
          <Card>
            <CardHeader>
              <CardTitle>Ways to Earn Coins</CardTitle>
              <CardDescription>
                Complete these activities to earn more coins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Daily Login</h4>
                      <p className="text-sm text-muted-foreground">Log in every day to claim 10 coins</p>
                    </div>
                  </div>
                  <Badge variant="outline">10 coins</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Post a Comment</h4>
                      <p className="text-sm text-muted-foreground">Earn coins for active participation</p>
                    </div>
                  </div>
                  <Badge variant="outline">5 coins</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Win Games</h4>
                      <p className="text-sm text-muted-foreground">Earn coins by winning mini-games</p>
                    </div>
                  </div>
                  <Badge variant="outline">20-50 coins</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Complete Achievements</h4>
                      <p className="text-sm text-muted-foreground">Unlock achievements to earn bonus coins</p>
                    </div>
                  </div>
                  <Badge variant="outline">Varies</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Rewards section */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards</CardTitle>
              <CardDescription>
                Redeem your coins for these exciting rewards
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="all">
              <div className="px-6">
                <TabsList className="w-full justify-start overflow-x-auto mb-4">
                  <TabsTrigger value="all">All Rewards</TabsTrigger>
                  <TabsTrigger value="gift-card">Gift Cards</TabsTrigger>
                  <TabsTrigger value="digital">Digital</TabsTrigger>
                  <TabsTrigger value="physical">Physical</TabsTrigger>
                  <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent>
                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rewards.map((reward) => (
                      <RewardCard 
                        key={reward.id} 
                        reward={reward} 
                        canRedeem={canRedeemReward(reward.cost)}
                        onRedeem={() => handleRedeemReward(reward)}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                {["gift-card", "digital", "physical", "exclusive"].map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filterRewardsByCategory(category).map((reward) => (
                        <RewardCard 
                          key={reward.id} 
                          reward={reward} 
                          canRedeem={canRedeemReward(reward.cost)}
                          onRedeem={() => handleRedeemReward(reward)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

interface RewardCardProps {
  reward: Reward;
  canRedeem: boolean;
  onRedeem: () => void;
}

const RewardCard = ({ reward, canRedeem, onRedeem }: RewardCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img 
          src={reward.image} 
          alt={reward.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{reward.name}</h3>
        <p className="text-sm text-muted-foreground">{reward.description}</p>
        <div className="flex items-center mt-2">
          <Coins className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="font-bold">{reward.cost}</span>
          <span className="text-xs ml-1 text-muted-foreground">coins</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onRedeem}
          disabled={!canRedeem}
          className="w-full"
          variant={canRedeem ? "default" : "outline"}
        >
          {canRedeem ? (
            <>
              <GiftIcon className="mr-2 h-4 w-4" /> Redeem Now
            </>
          ) : (
            "Not Enough Coins"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Earn;
