
import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ userId, showLabel = false, className = '' }) => {
  const { isUserOnline } = useOnlineStatus([userId]);
  const { t } = useLanguage();
  
  if (!userId) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${className}`}>
            <span 
              className={`relative flex h-2.5 w-2.5 ${isUserOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}
            >
              {isUserOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
            </span>
            
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {isUserOnline ? t('profile.online') : t('profile.offline')}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isUserOnline ? t('profile.userOnline') : t('profile.userOffline')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OnlineStatus;
