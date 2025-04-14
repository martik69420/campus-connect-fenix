
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

export interface AdminFeature {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}
