
import React from 'react';
import { 
  Star, 
  Award,
  Shield, 
  Rocket, 
  Heart,
  Sparkles, 
  Zap, 
  Trophy, 
  Crown, 
  Diamond, 
  BadgeCheck,
  Verified,
  Flame
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { UserBadge } from '@/types/user';

interface ProfileBadgesProps {
  badges: UserBadge[];
  className?: string;
}

export function ProfileBadges({ badges, className }: ProfileBadgesProps) {
  const getBadgeIcon = (iconName: string) => {
    switch(iconName) {
      case 'star': return <Star className="h-full w-full" />;
      case 'award': return <Award className="h-full w-full" />;
      case 'shield': return <Shield className="h-full w-full" />;
      case 'rocket': return <Rocket className="h-full w-full" />;
      case 'heart': return <Heart className="h-full w-full" />;
      case 'sparkles': return <Sparkles className="h-full w-full" />;
      case 'zap': return <Zap className="h-full w-full" />;
      case 'trophy': return <Trophy className="h-full w-full" />;
      case 'crown': return <Crown className="h-full w-full" />;
      case 'diamond': return <Diamond className="h-full w-full" />;
      case 'check': return <BadgeCheck className="h-full w-full" />;
      case 'verified': return <Verified className="h-full w-full" />;
      case 'flame': return <Flame className="h-full w-full" />;
      default: return <Award className="h-full w-full" />;
    }
  };
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <TooltipProvider>
        {badges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                  badge.earned ? "ring-2 ring-offset-2" : "opacity-40 grayscale"
                )}
                style={{ 
                  backgroundColor: badge.backgroundColor,
                  color: badge.color,
                  boxShadow: badge.earned ? `0 0 8px ${badge.color}` : 'none'
                }}
              >
                <div className="w-6 h-6">
                  {getBadgeIcon(badge.icon)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-center">
                <p className="font-bold">{badge.name}</p>
                <p className="text-xs">{badge.description}</p>
                {!badge.earned && <p className="text-xs italic mt-1">Not yet earned</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
