
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastActive: string;
}

export const useOnlineStatus = (userIds: string[] = []) => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userIds.length) {
      setIsLoading(false);
      return;
    }

    // Initial fetch of online statuses
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching online status for users:', userIds);

        const { data, error } = await supabase
          .from('user_status')
          .select('*')
          .in('user_id', userIds);

        if (error) {
          console.error('Error fetching online statuses:', error);
          return;
        }

        const statusMap: Record<string, boolean> = {};
        
        data?.forEach((status) => {
          // Consider someone online if their last active time is within the last 5 minutes
          const lastActive = new Date(status.last_active);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          statusMap[status.user_id] = status.is_online && lastActive > fiveMinutesAgo;
        });

        console.log('Online statuses:', statusMap);
        setOnlineStatuses(statusMap);
      } catch (error) {
        console.error('Error in fetchStatuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();

    // Subscribe to changes in online status
    const channel = supabase
      .channel('online-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
          filter: userIds.length > 0 ? `user_id.in.(${userIds.join(',')})` : undefined,
        },
        (payload) => {
          console.log('User status change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { user_id, is_online, last_active } = payload.new;
            
            // Check if the last_active timestamp is recent enough (within 5 minutes)
            const lastActive = new Date(last_active);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isRecentlyActive = lastActive > fiveMinutesAgo;
            
            setOnlineStatuses(prev => ({
              ...prev,
              [user_id]: is_online && isRecentlyActive
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds.join(',')]);

  const isUserOnline = (userId: string): boolean => {
    return !!onlineStatuses[userId];
  };

  return { isUserOnline, onlineStatuses, isLoading };
};
