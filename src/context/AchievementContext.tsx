import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { supabase } from '@/integrations/supabase/client';
import type { UserAchievement, UserBadge } from '@/types/user';

// Define context type
interface AchievementContextType {
  achievements: UserAchievement[];
  badges: UserBadge[];
  loading: boolean;
  fetchAchievements: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  claimAchievementReward: (achievementId: string) => Promise<void>;
}

// Create context
const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// Provider component
export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch achievements from Supabase
  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching achievements:', error);
        return;
      }

      // Map database data to UserAchievement type
      const formattedAchievements: UserAchievement[] = data.map(item => ({
        id: item.achievement_id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        progress: item.progress,
        maxProgress: item.max_progress,
        unlocked: item.unlocked,
        category: item.category,
        rarity: item.rarity,
        reward: item.reward,
        claimed: item.claimed,
        completedAt: item.completed_at
      }));

      setAchievements(formattedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch badges from Supabase
  const fetchBadges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching badges:', error);
        return;
      }

      // Map database data to UserBadge type
      const formattedBadges: UserBadge[] = data.map(item => ({
        id: item.badge_id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        color: item.color,
        backgroundColor: item.background_color,
        earned: item.earned,
        requirementDescription: item.requirement_description,
        progressCurrent: item.progress_current,
        progressTarget: item.progress_target
      }));

      setBadges(formattedBadges);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Claim achievement reward
  const claimAchievementReward = async (achievementId: string) => {
    if (!user) return;

    try {
      // Update achievement to claimed
      const { error } = await supabase
        .from('user_achievements')
        .update({ claimed: true })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);

      if (error) {
        console.error('Error claiming achievement reward:', error);
        return;
      }

      // Update local state
      setAchievements(prevAchievements =>
        prevAchievements.map(achievement =>
          achievement.id === achievementId ? { ...achievement, claimed: true } : achievement
        )
      );

      // Add coins to user balance (example)
      // You might want to move this logic to a separate function
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement && typeof achievement.reward === 'number') {
        // Update coins in database
        await supabase
          .from('profiles')
          .update({ coins: (user.coins || 0) + achievement.reward })
          .eq('id', user.id);

        // Update local state
        // Assuming you have a function to update user context
        // updateUser({ coins: (user.coins || 0) + achievement.reward });
      }
    } catch (error) {
      console.error('Error claiming achievement reward:', error);
    }
  };

  // Fetch achievements and badges on mount
  useEffect(() => {
    fetchAchievements();
    fetchBadges();
  }, [fetchAchievements, fetchBadges]);

  // Ensure we use the createdAt field properly when filtering achievement progress
  const userJoinDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const membershipDays = Math.floor((new Date().getTime() - userJoinDate.getTime()) / (1000 * 60 * 60 * 24));

  // Example logic to unlock achievements based on user progress
  useEffect(() => {
    if (!user) return;

    const updateAchievements = async () => {
      // Example: Unlock "Active Member" achievement after 30 days of membership
      const activeMemberAchievement = achievements.find(a => a.id === 'active_member');
      if (activeMemberAchievement && !activeMemberAchievement.unlocked && membershipDays >= 30) {
        // Update achievement to unlocked
        const { error } = await supabase
          .from('user_achievements')
          .update({ unlocked: true })
          .eq('user_id', user.id)
          .eq('achievement_id', 'active_member');

        if (error) {
          console.error('Error unlocking achievement:', error);
          return;
        }

        // Update local state
        setAchievements(prevAchievements =>
          prevAchievements.map(achievement =>
            achievement.id === 'active_member' ? { ...achievement, unlocked: true } : achievement
          )
        );
      }
    };

    updateAchievements();
  }, [user, achievements, membershipDays]);

  const value: AchievementContextType = {
    achievements,
    badges,
    loading,
    fetchAchievements,
    fetchBadges,
    claimAchievementReward,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};

// Custom hook to use the achievement context
export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
