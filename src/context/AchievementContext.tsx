
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { UserAchievement, UserBadge } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AchievementContextType {
  userAchievements: UserAchievement[];
  badges: UserBadge[];
  earnedBadges: UserBadge[];
  isLoading: boolean;
  refreshAchievements: () => Promise<void>;
  earnBadge: (badgeId: string) => Promise<boolean>;
  updateAchievementProgress: (achievementId: string, progress: number) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType>({
  userAchievements: [],
  badges: [],
  earnedBadges: [],
  isLoading: true,
  refreshAchievements: async () => {},
  earnBadge: async () => false,
  updateAchievementProgress: async () => {},
});

export const useAchievements = () => useContext(AchievementContext);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultBadges: UserBadge[] = [
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'Joined in the early days of Campus Connect',
      icon: '🚀',
      backgroundColor: '#4F46E5',
      color: 'white',
      earned: false,
    },
    {
      id: 'social-butterfly',
      name: 'Social Butterfly',
      description: 'Added 10 or more friends',
      icon: '🦋',
      backgroundColor: '#7C3AED',
      color: 'white',
      earned: false,
      requirementDescription: 'Add 10 friends',
      progressCurrent: 0,
      progressTarget: 10
    },
    {
      id: 'content-creator',
      name: 'Content Creator',
      description: 'Posted 5 times',
      icon: '✍️',
      backgroundColor: '#0EA5E9',
      color: 'white',
      earned: false,
      requirementDescription: 'Create 5 posts',
      progressCurrent: 0,
      progressTarget: 5
    },
    {
      id: 'snake-master',
      name: 'Snake Master',
      description: 'Scored over 100 in Snake game',
      icon: '🐍',
      backgroundColor: '#10B981',
      color: 'white',
      earned: false,
      requirementDescription: 'Score over 100 in Snake game',
      progressCurrent: 0,
      progressTarget: 100
    },
    {
      id: 'trivia-whiz',
      name: 'Trivia Whiz',
      description: 'Got a perfect score in Trivia',
      icon: '🧠',
      backgroundColor: '#F59E0B',
      color: 'white',
      earned: false,
      requirementDescription: 'Get all questions right in a trivia game',
    },
    {
      id: 'popular-post',
      name: 'Popular Post',
      description: 'Created a post with 10+ likes',
      icon: '⭐',
      backgroundColor: '#EC4899',
      color: 'white',
      earned: false,
      requirementDescription: 'Get 10 likes on a single post',
      progressCurrent: 0, 
      progressTarget: 10
    },
    {
      id: 'verified-student',
      name: 'Verified Student',
      description: 'Verified as a student at your school',
      icon: '🎓',
      backgroundColor: '#2563EB',
      color: 'white',
      earned: false,
    }
  ];

  const loadUserAchievements = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, fetch from database
      // For now, we'll check some conditions for badges
      const updatedBadges = [...defaultBadges];
      
      // Check join date for Early Adopter badge
      const earlyAdopterIndex = updatedBadges.findIndex(b => b.id === 'early-adopter');
      if (earlyAdopterIndex !== -1 && user.createdAt) {
        const joinDate = new Date(user.createdAt);
        const earlyDate = new Date('2023-12-31');
        if (joinDate <= earlyDate) {
          updatedBadges[earlyAdopterIndex].earned = true;
        }
      }
      
      // Check friend count for Social Butterfly badge
      const { count: friendCount, error: friendError } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: false })
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');
        
      if (!friendError) {
        const socialButterflyIndex = updatedBadges.findIndex(b => b.id === 'social-butterfly');
        if (socialButterflyIndex !== -1) {
          updatedBadges[socialButterflyIndex].progressCurrent = friendCount || 0;
          updatedBadges[socialButterflyIndex].earned = (friendCount || 0) >= 10;
        }
      }
      
      // Check post count for Content Creator
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', user.id);
        
      if (!postError) {
        const contentCreatorIndex = updatedBadges.findIndex(b => b.id === 'content-creator');
        if (contentCreatorIndex !== -1) {
          updatedBadges[contentCreatorIndex].progressCurrent = postCount || 0;
          updatedBadges[contentCreatorIndex].earned = (postCount || 0) >= 5;
        }
      }
      
      // Check for snake score
      const { data: snakeScores, error: snakeError } = await supabase
        .from('game_history')
        .select('score')
        .eq('user_id', user.id)
        .eq('game_type', 'snake')
        .order('score', { ascending: false })
        .limit(1);
        
      if (!snakeError && snakeScores && snakeScores.length > 0) {
        const bestSnakeScore = snakeScores[0].score;
        const snakeMasterIndex = updatedBadges.findIndex(b => b.id === 'snake-master');
        if (snakeMasterIndex !== -1) {
          updatedBadges[snakeMasterIndex].progressCurrent = bestSnakeScore;
          updatedBadges[snakeMasterIndex].earned = bestSnakeScore >= 100;
        }
      }
      
      // Check for posts with 10+ likes
      const { data: popularPosts, error: likeError } = await supabase
        .from('posts')
        .select(`
          id,
          likes:likes (user_id)
        `)
        .eq('user_id', user.id);
        
      if (!likeError && popularPosts) {
        const maxLikes = popularPosts.reduce((max, post) => {
          const likesCount = post.likes ? post.likes.length : 0;
          return Math.max(max, likesCount);
        }, 0);
        
        const popularPostIndex = updatedBadges.findIndex(b => b.id === 'popular-post');
        if (popularPostIndex !== -1) {
          updatedBadges[popularPostIndex].progressCurrent = maxLikes;
          updatedBadges[popularPostIndex].earned = maxLikes >= 10;
        }
      }
      
      // Set school verification badge
      const verifiedStudentIndex = updatedBadges.findIndex(b => b.id === 'verified-student');
      if (verifiedStudentIndex !== -1) {
        updatedBadges[verifiedStudentIndex].earned = !!user.school;
      }
      
      setBadges(updatedBadges);
      
      // Set some achievements based on badges
      const achievements: UserAchievement[] = [
        {
          id: 'social-network',
          name: 'Build Your Network',
          description: 'Add friends from your school',
          progress: friendCount || 0,
          maxProgress: 10,
          icon: '👥',
          completedAt: friendCount && friendCount >= 10 ? new Date().toISOString() : undefined,
          unlocked: true,
          reward: '50 coins'
        },
        {
          id: 'post-creator',
          name: 'Content Creator',
          description: 'Share your thoughts with the community',
          progress: postCount || 0,
          maxProgress: 5,
          icon: '✍️',
          completedAt: postCount && postCount >= 5 ? new Date().toISOString() : undefined,
          unlocked: true,
          reward: '30 coins'
        },
        {
          id: 'game-master',
          name: 'Game Master',
          description: 'Achieve high scores in campus games',
          progress: snakeScores && snakeScores.length > 0 ? Math.min(Math.floor(snakeScores[0].score / 10), 10) : 0,
          maxProgress: 10,
          icon: '🎮',
          completedAt: snakeScores && snakeScores.length > 0 && snakeScores[0].score >= 100 ? new Date().toISOString() : undefined,
          unlocked: true,
          reward: '100 coins'
        }
      ];
      
      setUserAchievements(achievements);
      
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const earnBadge = async (badgeId: string): Promise<boolean> => {
    if (!user) return false;
    
    const badgeIndex = badges.findIndex(b => b.id === badgeId);
    if (badgeIndex === -1 || badges[badgeIndex].earned) return false;
    
    // In a real app, you'd update the database
    const updatedBadges = [...badges];
    updatedBadges[badgeIndex].earned = true;
    setBadges(updatedBadges);
    
    toast({
      title: "Badge Earned!",
      description: `You've earned the ${badges[badgeIndex].name} badge!`,
    });
    
    return true;
  };

  const updateAchievementProgress = async (achievementId: string, progress: number): Promise<void> => {
    if (!user) return;
    
    const achievementIndex = userAchievements.findIndex(a => a.id === achievementId);
    if (achievementIndex === -1) return;
    
    const updatedAchievements = [...userAchievements];
    const achievement = updatedAchievements[achievementIndex];
    
    // Update progress
    achievement.progress = Math.min(progress, achievement.maxProgress);
    
    // Check if completed
    if (achievement.progress >= achievement.maxProgress && !achievement.completedAt) {
      achievement.completedAt = new Date().toISOString();
      
      toast({
        title: "Achievement Completed!",
        description: `You've completed the "${achievement.name}" achievement!`,
      });
    }
    
    setUserAchievements(updatedAchievements);
  };

  const refreshAchievements = async (): Promise<void> => {
    await loadUserAchievements();
  };

  useEffect(() => {
    if (user) {
      loadUserAchievements();
    }
  }, [user]);

  // Derived state for earned badges
  const earnedBadges = badges.filter(badge => badge.earned);

  return (
    <AchievementContext.Provider
      value={{
        userAchievements,
        badges,
        earnedBadges,
        isLoading,
        refreshAchievements,
        earnBadge,
        updateAchievementProgress,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};
