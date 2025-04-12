
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Star, Target, Gift, BookOpen, MessageSquare, Heart, UserPlus, Calendar, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from '@/context/AchievementContext';
import { motion } from 'framer-motion';
import { ProfileBadges } from '@/components/profile/ProfileBadges';

const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast } = useToast();
  const { achievements, badges, isLoading, claimAchievementReward } = useAchievements();

  const handleClaimReward = async (achievementId: string) => {
    if (!user) return;
    
    const success = await claimAchievementReward(achievementId);
    
    if (success) {
      const achievement = achievements.find(a => a.id === achievementId);
      toast({
        title: "Reward Claimed!",
        description: `You received ${achievement?.reward} coins for "${achievement?.name}"`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getIconComponent = (iconName: string): React.ReactNode => {
    switch (iconName) {
      case 'award': return <Award className="h-6 w-6" />;
      case 'trophy': return <Trophy className="h-6 w-6" />;
      case 'star': return <Star className="h-6 w-6" />;
      case 'target': return <Target className="h-6 w-6" />;
      case 'gift': return <Gift className="h-6 w-6" />;
      case 'book-open': return <BookOpen className="h-6 w-6" />;
      case 'message-square': return <MessageSquare className="h-6 w-6" />;
      case 'heart': return <Heart className="h-6 w-6" />;
      case 'user-plus': return <UserPlus className="h-6 w-6" />;
      case 'calendar': return <Calendar className="h-6 w-6" />;
      case 'user': return <UserIcon className="h-6 w-6" />;
      default: return <Award className="h-6 w-6" />;
    }
  };

  const getRarityColor = (rarity: string): string => {
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
                <CardTitle className="text-2xl">Achievements & Badges</CardTitle>
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
          
          {/* Display badges */}
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Your Badges</h3>
            <ProfileBadges badges={badges} />
          </CardContent>
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
              {isLoading ? (
                // Loading state
                Array(6).fill(0).map((_, index) => (
                  <Card key={index} className="border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-muted animate-pulse w-10 h-10"></div>
                        <div className="flex-1">
                          <div className="w-3/4 h-4 bg-muted animate-pulse rounded mb-2"></div>
                          <div className="w-full h-3 bg-muted animate-pulse rounded mb-4"></div>
                          <div className="w-full h-2 bg-muted animate-pulse rounded mb-1"></div>
                          <div className="flex justify-between">
                            <div className="w-10 h-3 bg-muted animate-pulse rounded"></div>
                            <div className="w-10 h-3 bg-muted animate-pulse rounded"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredAchievements.length > 0 ? (
                filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "transition-all hover:shadow-md cursor-pointer",
                        achievement.unlocked ? "border-primary/20" : "opacity-80"
                      )}
                      onClick={() => achievement.unlocked && handleClaimReward(achievement.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-2 rounded-full",
                            achievement.unlocked ? "bg-primary/10" : "bg-muted"
                          )}>
                            <div className={achievement.unlocked ? "text-primary" : "text-muted-foreground"}>
                              {getIconComponent(achievement.icon)}
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
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                  <Award className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-medium">No achievements found</h3>
                  <p className="text-muted-foreground">There are no achievements in this category yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AchievementsPage;
