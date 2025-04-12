
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

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'profile' | 'engagement' | 'social' | 'games' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward: number;
  claimed?: boolean;
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
