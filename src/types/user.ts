
export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  backgroundColor: string;
  color: string;
  earned: boolean;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  completedAt?: string;
  icon: string;
  unlocked?: boolean;
  reward?: string | number;
  category?: string;
  rarity?: string;
}
