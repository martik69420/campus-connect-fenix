
import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
  showLastActive?: boolean;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  userId, 
  showLabel = false, 
  className = '',
  showLastActive = true 
}) => {
  const { isUserOnline, onlineStatuses } = useOnlineStatus([userId]);
  const { t } = useLanguage();
  
  if (!userId) return null;
  
  // Get last active text from the hook
  const lastActive = onlineStatuses[userId]?.lastActive;
  
  // Determine what text to show for last active
  const getLastActiveText = () => {
    if (!lastActive) return t('profile.neverActive');
    return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${className}`}>
            <span 
              className={`relative flex h-2.5 w-2.5 ${isUserOnline(userId) ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}
            >
              {isUserOnline(userId) && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
            </span>
            
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {isUserOnline(userId) ? t('profile.online') : t('profile.offline')}
              </span>
            )}
            
            {showLastActive && !isUserOnline(userId) && lastActive && (
              <span className="text-xs text-muted-foreground ml-1">
                {getLastActiveText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isUserOnline(userId) 
              ? t('profile.userOnline') 
              : lastActive 
                ? `${t('profile.lastSeen')} ${getLastActiveText()}`
                : t('profile.userOffline')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OnlineStatus;
