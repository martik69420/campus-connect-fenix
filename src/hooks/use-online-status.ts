
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastActive: string;
}

export const useOnlineStatus = (userIds: string[] = []) => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Update current user's online status
  useEffect(() => {
    if (!user?.id) return;

    // When component mounts, set user as online
    const updateStatus = async () => {
      try {
        // Check if user already has a status record
        const { data, error: checkError } = await supabase
          .from('user_status')
          .select('id')
          .eq('user_id', user.id);

        if (checkError) {
          console.error("Error checking user status:", checkError);
          return;
        }

        const currentTime = new Date().toISOString();

        if (data && data.length > 0) {
          // Update existing status
          await supabase
            .from('user_status')
            .update({
              is_online: true,
              last_active: currentTime
            })
            .eq('user_id', user.id);
        } else {
          // Insert new status
          await supabase
            .from('user_status')
            .insert({
              user_id: user.id,
              is_online: true,
              last_active: currentTime
            });
        }

        // Set offline when the component unmounts
        const handleBeforeUnload = () => {
          try {
            // Use navigator.sendBeacon for better reliability during page unload
            const url = `${supabase.getUrl()}/rest/v1/user_status?user_id=eq.${user.id}`;
            navigator.sendBeacon(
              url,
              JSON.stringify({
                is_online: false,
                last_active: new Date().toISOString()
              })
            );
          } catch (error) {
            console.error("Error in beacon send:", error);
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Set up periodic updates of "last active" to maintain online status
        const pingInterval = setInterval(async () => {
          await supabase
            .from('user_status')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', user.id);
        }, 60000); // Update every minute

        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          clearInterval(pingInterval);
          
          // Set offline when the component unmounts (if page isn't being closed)
          supabase
            .from('user_status')
            .update({
              is_online: false,
              last_active: new Date().toISOString()
            })
            .eq('user_id', user.id);
        };
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    updateStatus();
  }, [user?.id]);

  useEffect(() => {
    if (!userIds.length) {
      setIsLoading(false);
      return;
    }

    // Initial fetch of online statuses
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        
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
          // Consider someone online if their last active time is within the last 3 minutes
          const lastActive = new Date(status.last_active);
          const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
          
          // Only mark as online if both is_online flag is true AND last_active is recent
          statusMap[status.user_id] = status.is_online && lastActive > threeMinutesAgo;
        });

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
          filter: userIds.length > 0 ? `user_id=in.(${userIds.join(',')})` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { user_id, is_online, last_active } = payload.new as { user_id: string, is_online: boolean, last_active: string };
            
            // Check if the last_active timestamp is recent enough (within 3 minutes)
            const lastActive = new Date(last_active);
            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
            const isRecentlyActive = lastActive > threeMinutesAgo;
            
            setOnlineStatuses(prev => ({
              ...prev,
              [user_id]: is_online && isRecentlyActive
            }));
          }
        }
      )
      .subscribe();

    // Set up a refresh interval to periodically check if "online" users are still active
    const refreshInterval = setInterval(() => {
      // Refetch statuses every minute to make sure we have the latest data
      fetchStatuses();
    }, 60000); // Check every minute

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [userIds.join(',')]);

  const isUserOnline = (userId: string): boolean => {
    return !!onlineStatuses[userId];
  };

  return { isUserOnline, onlineStatuses, isLoading };
};
