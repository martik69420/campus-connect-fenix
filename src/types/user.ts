
export interface UserSettingsType {
  privacyProfile: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showSchool: boolean;
  showLocation: boolean;
  showLikedPosts: boolean;
  showSavedPosts: boolean;
  showActivity: boolean;
  showFriendsList: boolean;
  readReceipts: boolean;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  backgroundColor: string;
  earned: boolean;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward: number;
  unlocked: boolean;
  unlockedAt?: string;
  category: string;
  icon: string;
}
