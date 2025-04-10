import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Update import path for useAuth
import { useAuth } from '@/context/auth';

interface OnlineStatus {
  isOnline: boolean | null;
  lastSeen: string | null;
}

const useOnlineStatus = (userId: string | undefined): OnlineStatus => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_online, last_seen')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching initial online status:', error);
          return;
        }

        setIsOnline(data?.is_online ?? null);
        setLastSeen(data?.last_seen ?? null);
      } catch (error) {
        console.error('Error fetching initial online status:', error);
      }
    };

    fetchInitialStatus();

    const presenceChannel = supabase
      .channel('presence', { config: { broadcast: { self: true } } })
      .on('presence', { event: 'sync' }, () => {
        // Handle presence updates
        presenceChannel.track({ user_id: userId });
      })
      .on('broadcast', { event: 'online_status' }, (payload) => {
        if (payload.user_id === userId) {
          setIsOnline(payload.isOnline);
          setLastSeen(payload.lastSeen);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          presenceChannel.track({ user_id: userId });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [userId, user]);

  return { isOnline, lastSeen };
};

export default useOnlineStatus;
