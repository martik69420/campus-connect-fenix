
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Check, Gift, Trophy, Lock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAchievements } from '@/context/AchievementContext';
import { motion } from 'framer-motion';

const Achievements: React.FC = () => {
  const { badges, userAchievements } = useAchievements();
  
  // Since claimAchievementReward is missing, we'll define a placeholder function
  const claimAchievementReward = (id: string) => {
    console.log('Achievement reward claimed for:', id);
    // In a real implementation, this would call an API
  };

  useEffect(() => {
    // Track page view
    console.log('Achievements page viewed');
  }, []);

  const earnedBadges = badges.filter(badge => badge.earned);
  const lockedBadges = badges.filter(badge => !badge.earned);
  
  const inProgressAchievements = userAchievements.filter(
    a => a.progress > 0 && a.progress < a.maxProgress
  );
  
  const completedAchievements = userAchievements.filter(
    a => a.progress >= a.maxProgress
  );

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-amber-500" /> Achievements
            </h1>
            <p className="text-muted-foreground">Complete actions to earn badges and rewards</p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Award className="h-4 w-4 mr-2 text-primary" />
            <span>{earnedBadges.length}/{badges.length} Badges Earned</span>
          </Badge>
        </div>
        
        {/* Badges Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" />
              Earned Badges
            </CardTitle>
            <CardDescription>Badges you've unlocked through your activities</CardDescription>
          </CardHeader>
          <CardContent>
            {earnedBadges.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>You haven't earned any badges yet. Complete achievements to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {earnedBadges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg text-center"
                  >
                    <div 
                      className="text-3xl mb-2" 
                      style={{ color: badge.color }}
                    >
                      {badge.icon}
                    </div>
                    <span className="font-medium text-sm">{badge.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{badge.description}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* In-Progress Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              In Progress
            </CardTitle>
            <CardDescription>Achievements you're currently working on</CardDescription>
          </CardHeader>
          <CardContent>
            {inProgressAchievements.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No achievements in progress. Start interacting with the platform!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inProgressAchievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <div className="mr-3 text-2xl">{achievement.icon}</div>
                        <div>
                          <h3 className="font-medium">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{achievement.category}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Completed Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              Completed
            </CardTitle>
            <CardDescription>Achievements you've completed</CardDescription>
          </CardHeader>
          <CardContent>
            {completedAchievements.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>You haven't completed any achievements yet. Keep going!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg bg-muted/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 text-2xl">{achievement.icon}</div>
                        <div>
                          <h3 className="font-medium">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="secondary" className="mr-2">{achievement.rarity}</Badge>
                            {achievement.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                Completed on {new Date(achievement.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {achievement.reward && !achievement.claimed && (
                        <Button 
                          size="sm" 
                          onClick={() => claimAchievementReward(achievement.id)}
                          className="flex items-center"
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Claim {achievement.reward} Coins
                        </Button>
                      )}
                      {achievement.claimed && (
                        <Badge variant="outline" className="bg-green-500/10">
                          <Check className="h-3 w-3 mr-1" /> Claimed
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Locked Badges */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Lock className="mr-2 h-5 w-5 text-muted-foreground" />
              Locked Badges
            </CardTitle>
            <CardDescription>Badges you've yet to earn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg text-center opacity-60"
                >
                  <div className="text-3xl mb-2 text-muted-foreground">
                    {badge.icon}
                  </div>
                  <span className="font-medium text-sm">{badge.name}</span>
                  <div className="flex items-center mt-2">
                    <Lock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Locked</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Achievements;
