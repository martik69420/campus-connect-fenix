
import React from 'react';
import { UserBadge } from '@/types/user';
import { 
  Trophy, Star, Award, Shield, Code, 
  Bug, Heart, Rocket, Check, Crown, Zap
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileBadgesProps {
  badges: UserBadge[];
}

const ProfileBadges: React.FC<ProfileBadgesProps> = ({ badges }) => {
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
      default: return <Award {...props} />;
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {badges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div 
                className={`p-1.5 rounded-full cursor-pointer transition-transform hover:scale-110 ${badge.earned ? '' : 'opacity-40'}`}
                style={{ backgroundColor: badge.backgroundColor }}
              >
                <div style={{ color: badge.color }}>
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
