
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Award, Trophy, Star, Target, Gift, BookOpen, MessageSquare, Heart, UserPlus, Calendar, Gem, Shield, Flame, Crown, Medal } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { UserAchievement, UserBadge } from '@/types/user';

interface AchievementContextType {
  achievements: UserAchievement[];
  badges: UserBadge[];
  earnedAchievements: UserAchievement[];
  earnedBadges: UserBadge[];
  isLoading: boolean;
  refreshAchievements: () => Promise<void>;
  claimAchievementReward: (achievementId: string) => Promise<boolean>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth(); // Use auth object instead of destructuring to avoid early access
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load achievements and badges
  useEffect(() => {
    if (auth.user) {
      refreshAchievements();
    }
  }, [auth.user]);

  const refreshAchievements = async () => {
    if (!auth.user) return;
    
    setIsLoading(true);
    try {
      // In a real app, fetch from database
      // For now, we'll use mock data
      const mockAchievements: UserAchievement[] = [
        {
          id: 'welcome',
          name: 'Welcome Aboard',
          description: 'Join our community',
          icon: 'award',
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
          icon: 'message-square',
          progress: auth.user ? 1 : 0,
          maxProgress: 1,
          unlocked: true,
          category: 'engagement',
          rarity: 'common',
          reward: 100
        },
        {
          id: 'profile-complete',
          name: 'Identity Established',
          description: 'Complete your profile information',
          icon: 'user',
          progress: auth.user?.bio ? 1 : 0,
          maxProgress: 1,
          unlocked: auth.user?.bio ? true : false,
          category: 'profile',
          rarity: 'uncommon',
          reward: 150
        },
        {
          id: 'friend-maker',
          name: 'Friend Maker',
          description: 'Add 5 friends',
          icon: 'user-plus',
          progress: 0,
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
          icon: 'target',
          progress: 0,
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
          icon: 'book-open',
          progress: 0,
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
          icon: 'heart',
          progress: 0,
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
          icon: 'calendar',
          progress: 1,
          maxProgress: 30,
          unlocked: false,
          category: 'engagement',
          rarity: 'legendary',
          reward: 1000
        }
      ];

      // Mock badges
      const mockBadges: UserBadge[] = [
        {
          id: 'early-adopter',
          name: 'Early Adopter',
          description: 'One of the first users on the platform',
          icon: 'rocket',
          color: '#ffffff',
          backgroundColor: '#5865F2',
          earned: true
        },
        {
          id: 'verified',
          name: 'Verified',
          description: 'Identity verified',
          icon: 'verified',
          color: '#ffffff',
          backgroundColor: '#3BA55C',
          earned: Math.random() > 0.5 // Random for demo
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Premium membership',
          icon: 'crown',
          color: '#ffffff',
          backgroundColor: '#FF73FA',
          earned: Math.random() > 0.5 // Random for demo
        },
        {
          id: 'contributor',
          name: 'Contributor',
          description: 'Community contributor',
          icon: 'gem',
          color: '#ffffff',
          backgroundColor: '#9B59B6',
          earned: true
        },
        {
          id: 'veteran',
          name: 'Veteran',
          description: 'Active for more than a year',
          icon: 'medal',
          color: '#ffffff',
          backgroundColor: '#F1C40F',
          earned: false
        },
        {
          id: 'developer',
          name: 'Developer',
          description: 'Contributed to the platform',
          icon: 'code',
          color: '#ffffff',
          backgroundColor: '#F57C00',
          earned: false
        },
        {
          id: 'bug-hunter',
          name: 'Bug Hunter',
          description: 'Found and reported bugs',
          icon: 'bug',
          color: '#ffffff',
          backgroundColor: '#ED4245',
          earned: false
        },
        {
          id: 'supporter',
          name: 'Supporter',
          description: 'Supported the platform',
          icon: 'heart',
          color: '#ffffff',
          backgroundColor: '#FFA500',
          earned: true
        }
      ];

      setAchievements(mockAchievements);
      setBadges(mockBadges);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimAchievementReward = async (achievementId: string): Promise<boolean> => {
    if (!auth.user) return false;
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.unlocked) return false;
    
    try {
      // Convert the reward to a number to fix the type error
      const rewardAmount = typeof achievement.reward === 'string' 
        ? parseInt(achievement.reward, 10) 
        : achievement.reward;
      
      if (isNaN(rewardAmount)) {
        console.error("Invalid reward amount:", achievement.reward);
        return false;
      }
      
      const success = await auth.addCoins(
        rewardAmount,
        `Achievement reward: ${achievement.name}`
      );
      
      if (success) {
        // Optimistically update the local state to mark it as claimed
        setAchievements(prevAchievements => 
          prevAchievements.map(a => 
            a.id === achievementId ? { ...a, claimed: true } : a
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error claiming achievement reward:", error);
      return false;
    }
  };

  const earnedAchievements = achievements.filter(a => a.unlocked);
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <AchievementContext.Provider 
      value={{ 
        achievements, 
        badges, 
        earnedAchievements, 
        earnedBadges,
        isLoading, 
        refreshAchievements,
        claimAchievementReward
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
