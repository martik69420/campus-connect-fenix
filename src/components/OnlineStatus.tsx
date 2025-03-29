
import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { Wifi, WifiOff } from 'lucide-react';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
  showLastActive?: boolean;
  showIcon?: boolean;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  userId, 
  showLabel = false, 
  className = '',
  showLastActive = true,
  showIcon = false
}) => {
  const { isUserOnline, onlineStatuses } = useOnlineStatus([userId]);
  const { t } = useLanguage();
  
  if (!userId) return null;
  
  // Get last active text from the hook
  const lastActive = onlineStatuses[userId]?.lastActive;
  
  // Determine what text to show for last active
  const getLastActiveText = () => {
    if (!lastActive) return t('profile.neverActive');
    
    try {
      return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting last active time:", error);
      return t('profile.neverActive');
    }
  };
  
  const isOnline = isUserOnline(userId);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${className}`}>
            {showIcon ? (
              isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
              )
            ) : (
              <span 
                className={`relative flex h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}
              >
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
              </span>
            )}
            
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {isOnline ? t('profile.online') : t('profile.offline')}
              </span>
            )}
            
            {showLastActive && !isOnline && lastActive && (
              <span className="text-xs text-muted-foreground ml-1">
                {getLastActiveText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOnline 
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
