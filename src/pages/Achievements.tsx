
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth, User } from '@/context/auth'; // Import the User type
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Star, Target, Gift, BookOpen, MessageSquare, Heart, UserPlus, Calendar, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define achievement types
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'engagement' | 'social' | 'games' | 'profile' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward: number;
}

const AchievementsPage: React.FC = () => {
  const { user, addCoins, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - would be fetched from backend in a real app
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      
      // In a real app, this would fetch from an API or database
      // For now, we're using mock data
      const mockAchievements: Achievement[] = [
        {
          id: 'welcome',
          name: 'Welcome Aboard',
          description: 'Join our community',
          icon: <Award className="h-6 w-6" />,
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          category: 'profile',
          rarity: 'common',
          reward: 50
        },
        {
          id: 'first-post',
          name: 'First Words',
          description: 'Create your first post',
          icon: <MessageSquare className="h-6 w-6" />,
          progress: user ? 1 : 0,
          maxProgress: 1,
          unlocked: user ? true : false,
          category: 'engagement',
          rarity: 'common',
          reward: 100
        },
        {
          id: 'profile-complete',
          name: 'Identity Established',
          description: 'Complete your profile information',
          icon: <User className="h-6 w-6" />,
          progress: user?.bio ? 1 : 0,
          maxProgress: 1,
          unlocked: user?.bio ? true : false,
          category: 'profile',
          rarity: 'uncommon',
          reward: 150
        },
        {
          id: 'friend-maker',
          name: 'Friend Maker',
          description: 'Add 5 friends',
          icon: <UserPlus className="h-6 w-6" />,
          progress: 0, // Would be dynamically calculated
          maxProgress: 5,
          unlocked: false,
          category: 'social',
          rarity: 'uncommon',
          reward: 200
        },
        {
          id: 'snake-master',
          name: 'Snake Charmer',
          description: 'Score over 100 in Snake game',
          icon: <Target className="h-6 w-6" />,
          progress: 0, // Would be dynamically calculated
          maxProgress: 100,
          unlocked: false,
          category: 'games',
          rarity: 'rare',
          reward: 300
        },
        {
          id: 'trivia-wizard',
          name: 'Trivia Wizard',
          description: 'Answer 20 trivia questions correctly',
          icon: <BookOpen className="h-6 w-6" />,
          progress: 0, // Would be dynamically calculated
          maxProgress: 20,
          unlocked: false,
          category: 'games',
          rarity: 'rare',
          reward: 300
        },
        {
          id: 'popular-post',
          name: 'Trending Topic',
          description: 'Get 50 likes on a post',
          icon: <Heart className="h-6 w-6" />,
          progress: 0, // Would be dynamically calculated
          maxProgress: 50,
          unlocked: false,
          category: 'engagement',
          rarity: 'epic',
          reward: 500
        },
        {
          id: 'active-user',
          name: 'Dedicated Member',
          description: 'Log in for 30 consecutive days',
          icon: <Calendar className="h-6 w-6" />,
          progress: 1, // Would be dynamically calculated
          maxProgress: 30,
          unlocked: false,
          category: 'engagement',
          rarity: 'legendary',
          reward: 1000
        }
      ];

      setAchievements(mockAchievements);
      setIsLoading(false);
    };

    fetchAchievements();
  }, [user]);

  const handleClaimReward = async (achievement: Achievement) => {
    if (!achievement.unlocked || !user) return;

    // Update user's coins
    const success = await addCoins(achievement.reward, `Claimed achievement: ${achievement.name}`);
    
    if (success) {
      toast({
        title: "Reward Claimed!",
        description: `You received ${achievement.reward} coins for "${achievement.name}"`,
      });
      
      // In a real app, mark the achievement as claimed
      // For now, just refresh user data
      refreshUser();
    } else {
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'bg-slate-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const filteredAchievements = activeTab === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeTab);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="container py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Achievements</CardTitle>
                <CardDescription>
                  Unlock achievements to earn rewards and showcase your progress
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{unlockedCount}/{totalAchievements}</div>
                <div className="text-xs text-muted-foreground">Achievements Unlocked</div>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2 mt-2" />
          </CardHeader>
        </Card>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="flex-shrink-0">All</TabsTrigger>
            <TabsTrigger value="engagement" className="flex-shrink-0">Engagement</TabsTrigger>
            <TabsTrigger value="social" className="flex-shrink-0">Social</TabsTrigger>
            <TabsTrigger value="games" className="flex-shrink-0">Games</TabsTrigger>
            <TabsTrigger value="profile" className="flex-shrink-0">Profile</TabsTrigger>
            <TabsTrigger value="special" className="flex-shrink-0">Special</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  achievement.unlocked ? "border-primary/20" : "opacity-80"
                )}
                onClick={() => achievement.unlocked && handleClaimReward(achievement)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        achievement.unlocked ? "bg-primary/10" : "bg-muted"
                      )}>
                        <div className={achievement.unlocked ? "text-primary" : "text-muted-foreground"}>
                          {achievement.icon}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{achievement.name}</h3>
                          <Badge className={cn(
                            "ml-2",
                            getRarityColor(achievement.rarity)
                          )}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs">{achievement.progress}/{achievement.maxProgress}</span>
                          <span className="text-xs flex items-center">
                            <Trophy className="h-3 w-3 text-amber-500 mr-1" />
                            {achievement.reward}
                          </span>
                        </div>
                        
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AchievementsPage;
