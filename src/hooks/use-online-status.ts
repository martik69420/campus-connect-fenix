
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export interface UserStatus {
  isOnline: boolean | null;
  lastActive: string | null;
  status: 'online' | 'away' | 'offline';
}

export interface OnlineStatusHook {
  isUserOnline: (userId: string) => boolean;
  onlineStatuses: Record<string, UserStatus>;
  getUserStatus: (userId: string) => 'online' | 'away' | 'offline';
}

const useOnlineStatus = (userIds: string[]): OnlineStatusHook => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, UserStatus>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!userIds.length) {
      return;
    }

    // Initialize with default offline status for all requested user IDs
    const initialStatuses: Record<string, UserStatus> = {};
    userIds.forEach(userId => {
      initialStatuses[userId] = {
        isOnline: false, 
        lastActive: null,
        status: 'offline'
      };
    });
    setOnlineStatuses(initialStatuses);

    const fetchInitialStatus = async () => {
      try {
        // Fetch from user_status table
        const { data, error } = await supabase
          .from('user_status')
          .select('user_id, is_online, last_active')
          .in('user_id', userIds);

        if (error) {
          console.error('Error fetching initial online status:', error);
          return;
        }

        const statusMap: Record<string, UserStatus> = {...initialStatuses};
        data?.forEach(item => {
          // Determine status (online, away, or offline)
          let status: 'online' | 'away' | 'offline' = 'offline';
          
          if (item.is_online) {
            status = 'online';
          } else if (item.last_active) {
            // Check if last active was within the last 5 minutes
            const lastActiveTime = new Date(item.last_active).getTime();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            
            if (lastActiveTime > fiveMinutesAgo) {
              status = 'away';
            }
          }
          
          statusMap[item.user_id] = {
            isOnline: item.is_online || false,
            lastActive: item.last_active || null,
            status
          };
        });

        setOnlineStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching initial online status:', error);
      }
    };

    fetchInitialStatus();

    // Subscribe to real-time updates
    const presenceChannel = supabase
      .channel('presence-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'user_status',
        filter: `user_id=in.(${userIds.join(',')})`,
      }, (payload) => {
        const { new: newStatus } = payload;
        
        if (newStatus && 'user_id' in newStatus) {
          const userId = newStatus.user_id as string;
          const isOnline = newStatus.is_online as boolean;
          const lastActive = newStatus.last_active as string;
          
          // Determine status
          let status: 'online' | 'away' | 'offline' = 'offline';
          if (isOnline) {
            status = 'online';
          } else if (lastActive) {
            const lastActiveTime = new Date(lastActive).getTime();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            
            if (lastActiveTime > fiveMinutesAgo) {
              status = 'away';
            }
          }
          
          setOnlineStatuses(prev => ({
            ...prev,
            [userId]: {
              isOnline,
              lastActive,
              status
            }
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userIds, JSON.stringify(userIds)]);

  const isUserOnline = (userId: string): boolean => {
    return onlineStatuses[userId]?.isOnline || false;
  };

  const getUserStatus = (userId: string): 'online' | 'away' | 'offline' => {
    return onlineStatuses[userId]?.status || 'offline';
  };

  return { 
    isUserOnline, 
    onlineStatuses,
    getUserStatus 
  };
};

export default useOnlineStatus;
