
import React from 'react';
import useOnlineStatus from '@/hooks/use-online-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { Wifi, WifiOff, Clock } from 'lucide-react';

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
  const { isUserOnline, onlineStatuses, getUserStatus } = useOnlineStatus([userId]);
  const { t } = useLanguage();
  
  if (!userId) return null;
  
  // Get last active text from the hook
  const lastActive = onlineStatuses[userId]?.lastActive;
  const status = getUserStatus(userId);
  
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
  
  const isOnline = status === 'online';
  const isAway = status === 'away';
  
  // Get color based on status
  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isAway) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  // Get animation based on status
  const getStatusAnimation = () => {
    if (isOnline) return 'animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75';
    if (isAway) return 'animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75';
    return '';
  };
  
  // Get status text
  const getStatusText = () => {
    if (isOnline) return t('profile.online');
    if (isAway) return t('profile.away');
    return t('profile.offline');
  };
  
  // Get icon based on status
  const getStatusIcon = () => {
    if (isOnline) return <Wifi className="h-3.5 w-3.5 text-green-500" />;
    if (isAway) return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    return <WifiOff className="h-3.5 w-3.5 text-gray-400" />;
  };
  
  // Get tooltip text based on status
  const getTooltipText = () => {
    if (isOnline) return t('profile.userOnline');
    if (isAway) return t('profile.userAway') || 'User is away';
    return lastActive 
      ? `${t('profile.lastSeen')} ${getLastActiveText()}`
      : t('profile.userOffline');
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${className}`}>
            {showIcon ? (
              getStatusIcon()
            ) : (
              <span 
                className={`relative flex h-2.5 w-2.5 ${getStatusColor()} rounded-full`}
              >
                {(isOnline || isAway) && (
                  <span className={getStatusAnimation()}></span>
                )}
              </span>
            )}
            
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
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
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OnlineStatus;
