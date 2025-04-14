
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserBadge } from '@/types/user';
import { CheckCircle2, LockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ProfileBadgesProps {
  badges: UserBadge[];
  className?: string;
}

const ProfileBadges: React.FC<ProfileBadgesProps> = ({ badges, className }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <p>No badges earned yet</p>
        <p className="text-sm mt-1">Complete challenges to earn badges</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
      {badges.map((badge) => (
        <TooltipProvider key={badge.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "relative rounded-full aspect-square overflow-hidden border-4 cursor-pointer",
                  badge.earned 
                    ? `border-${badge.backgroundColor}/60` 
                    : "border-gray-200 dark:border-gray-800 opacity-60"
                )}
              >
                <Card 
                  className={cn(
                    "h-full w-full flex items-center justify-center",
                    badge.earned ? `bg-${badge.backgroundColor}/20` : "bg-muted/50"
                  )}
                >
                  <CardContent className="h-full flex flex-col items-center justify-center p-3">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div
                        className={cn(
                          "text-3xl md:text-4xl",
                          badge.earned ? badge.color : "text-muted-foreground"
                        )}
                      >
                        {badge.icon === 'admin' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" height="36" width="36" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                          </svg>
                        ) : (
                          badge.icon
                        )}
                      </div>
                      <Badge 
                        className={cn(
                          "mt-2 max-w-[90%] text-xs truncate",
                          badge.earned 
                            ? `bg-${badge.backgroundColor} text-${badge.color}`
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {badge.name}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {badge.earned ? (
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 bg-muted rounded-full p-1">
                    <LockIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="p-1 max-w-xs">
                <p className="font-bold">{badge.name}</p>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                {!badge.earned && badge.requirementDescription && (
                  <div className="mt-1 pt-1 border-t border-border text-xs">
                    <strong>Requirement:</strong> {badge.requirementDescription}
                    {badge.progressCurrent !== undefined && badge.progressTarget !== undefined && (
                      <div className="mt-1">
                        Progress: {badge.progressCurrent}/{badge.progressTarget}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default ProfileBadges;
