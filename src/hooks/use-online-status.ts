
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
        // Fetch from user_status table
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

    // Subscribe to realtime changes on the user_status table
    const statusChannel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload) => {
          const { new: newStatus } = payload;
          if (newStatus) {
            setOnlineStatuses(prev => ({
              ...prev,
              [newStatus.user_id]: {
                isOnline: newStatus.is_online || false,
                lastActive: newStatus.last_active || null,
                status: newStatus.is_online ? 'online' : 'offline'
              }
            }));
          }
        }
      )
      .subscribe();

    // Update current user's online status
    const updateMyStatus = async () => {
      if (!user?.id) return;
      
      await supabase
        .from('user_status')
        .upsert(
          { user_id: user.id, is_online: true, last_active: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    };
    
    if (user?.id) {
      updateMyStatus();
      
      // Set up interval to update status
      const interval = setInterval(updateMyStatus, 60000); // Update every minute
      
      // Set up event listeners for presence detection
      window.addEventListener('beforeunload', async () => {
        await supabase
          .from('user_status')
          .update({ is_online: false, last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      });
      
      return () => {
        clearInterval(interval);
        supabase.removeChannel(statusChannel);
      };
    }
    
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [userIds.join(','), user?.id]);

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
