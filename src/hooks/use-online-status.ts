
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

    const fetchInitialStatus = async () => {
      try {
        // Fetch from user_status table instead of profiles
        const { data, error } = await supabase
          .from('user_status')
          .select('user_id, is_online, last_active')
          .in('user_id', userIds);

        if (error) {
          console.error('Error fetching initial online status:', error);
          return;
        }

        const statusMap: Record<string, UserStatus> = {};
        data?.forEach(item => {
          statusMap[item.user_id] = {
            isOnline: item.is_online || false,
            lastActive: item.last_active || null,
            status: item.is_online ? 'online' : 'offline'
          };
        });

        setOnlineStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching initial online status:', error);
      }
    };

    fetchInitialStatus();

    const presenceChannel = supabase
      .channel('presence', { config: { broadcast: { self: true } } })
      .on('presence', { event: 'sync' }, () => {
        // Handle presence updates
        presenceChannel.track({ user_id: userIds });
      })
      .on('broadcast', { event: 'online_status' }, (payload) => {
        if (userIds.includes(payload.user_id)) {
          setOnlineStatuses(prev => ({
            ...prev,
            [payload.user_id]: {
              isOnline: payload.isOnline,
              lastActive: payload.lastSeen,
              status: payload.isOnline ? 'online' : 'offline'
            }
          }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          presenceChannel.track({ user_id: userIds });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [userIds, user]);

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
