
import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

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
  showLastActive = false
}) => {
  const { isUserOnline } = useOnlineStatus([userId]);
  const { t } = useLanguage();
  const [lastActive, setLastActive] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    const fetchLastActive = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_status')
          .select('last_active')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error("Error fetching last active status:", error);
          return;
        }
        
        if (data?.last_active) {
          setLastActive(new Date(data.last_active));
        }
      } catch (error) {
        console.error("Failed to fetch last active time:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLastActive();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('user-last-active')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_status',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.last_active) {
            setLastActive(new Date(payload.new.last_active));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
    
  }, [userId]);
  
  if (!userId) return null;
  
  // Determine what text to show for last active
  const getLastActiveText = () => {
    if (isLoading) return t('profile.loading');
    if (!lastActive) return t('profile.neverActive');
    
    return formatDistanceToNow(lastActive, { addSuffix: true });
  };
  
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
            
            {showLastActive && !isUserOnline && lastActive && (
              <span className="text-xs text-muted-foreground ml-1">
                {getLastActiveText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isUserOnline 
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
