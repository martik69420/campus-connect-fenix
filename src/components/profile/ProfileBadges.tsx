
import React from 'react';
import { UserBadge } from '@/types/user';
import { 
  Trophy, Star, Award, Shield, Code, 
  Bug, Heart, Rocket, Check, Crown, Zap,
  Verified, Gem, Flame, Gift, Medal
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ProfileBadgesProps {
  badges: UserBadge[];
  showAllBadges?: boolean;
  className?: string;
}

const ProfileBadges: React.FC<ProfileBadgesProps> = ({ 
  badges, 
  showAllBadges = false,
  className 
}) => {
  const renderBadgeIcon = (iconName: string) => {
    const props = { className: "h-4 w-4" };
    
    switch (iconName) {
      case 'trophy': return <Trophy {...props} />;
      case 'star': return <Star {...props} />;
      case 'award': return <Award {...props} />;
      case 'shield': return <Shield {...props} />;
      case 'code': return <Code {...props} />;
      case 'bug': return <Bug {...props} />;
      case 'heart': return <Heart {...props} />;
      case 'rocket': return <Rocket {...props} />;
      case 'check': return <Check {...props} />;
      case 'crown': return <Crown {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'verified': return <Verified {...props} />;
      case 'gem': return <Gem {...props} />;
      case 'flame': return <Flame {...props} />;
      case 'gift': return <Gift {...props} />;
      case 'medal': return <Medal {...props} />;
      case 'admin': return <Shield {...props} />;
      default: return <Award {...props} />;
    }
  };
  
  const displayedBadges = showAllBadges 
    ? badges 
    : badges.filter(badge => badge.earned);
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <TooltipProvider>
        {displayedBadges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "p-1.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 shadow-sm border", 
                  badge.earned ? '' : 'opacity-40',
                  badge.id === 'admin' ? 'border-orange-500/50' : 'border-transparent'
                )}
                style={{ backgroundColor: badge.backgroundColor }}
              >
                <div className={badge.earned ? 'animate-pulse' : ''} style={{ color: badge.color }}>
                  {renderBadgeIcon(badge.icon)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 p-1">
                <p className="font-bold">{badge.name}</p>
                <p className="text-xs">{badge.description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ProfileBadges;
