
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Define types for presence data
type PresenceUserStatus = {
  user_id: string;
  status: 'online' | 'offline';
  online_at: string;
};

type UserStatus = {
  isOnline: boolean;
  lastActive: string | null;
};

export const useOnlineStatus = (userIds: string[] = []) => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, UserStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Update current user's online status
  useEffect(() => {
    if (!user?.id) return;

    // When component mounts, set user as online
    const updatePresence = async () => {
      try {
        const currentTime = new Date().toISOString();
        
        // Use presence channels for real-time status tracking
        const channel = supabase.channel('online-users');
        
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track the user's presence when online
            await channel.track({
              user_id: user.id,
              online_at: currentTime,
              status: 'online'
            });
            
            // Store last active time in localStorage as fallback
            localStorage.setItem('lastActiveTime', currentTime);
          }
        });

        // Update presence state periodically to maintain "online" status
        const pingInterval = setInterval(async () => {
          const newTime = new Date().toISOString();
          await channel.track({
            user_id: user.id,
            online_at: newTime,
            status: 'online'
          });
          localStorage.setItem('lastActiveTime', newTime);
        }, 30000); // Update every 30 seconds

        // Set up handler for page close/refresh
        const handleBeforeUnload = () => {
          const offlineTime = new Date().toISOString();
          localStorage.setItem('lastOfflineTime', offlineTime);
          
          // Use beacon API for reliable offline status update when page closes
          try {
            navigator.sendBeacon(
              `${window.location.origin}/api/set-offline`,
              JSON.stringify({ user_id: user.id, time: offlineTime })
            );
          } catch (error) {
            console.error("Error in beacon send:", error);
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          clearInterval(pingInterval);
          
          // Set offline when component unmounts (if page isn't being closed)
          channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: 'offline'
          });
          
          // Clean up the channel subscription
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    updatePresence();
  }, [user?.id]);

  // Listen for status changes of specified users
  useEffect(() => {
    if (!userIds.length) {
      setIsLoading(false);
      return;
    }

    // Initial fetch of online statuses from presence channel
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        
        // Subscribe to the presence channel for all specified users
        const channel = supabase.channel('online-users-tracking');
        
        await channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;
          
          // Get current presence state
          const presenceState = channel.presenceState();
          
          // Process the presence data
          const statusMap: Record<string, UserStatus> = {};
          
          // Initialize all requested userIds with offline status
          userIds.forEach(id => {
            statusMap[id] = {
              isOnline: false,
              lastActive: null
            };
          });
          
          // Process presence data for each channel
          Object.keys(presenceState).forEach(key => {
            const presences = presenceState[key];
            
            presences.forEach(presence => {
              // We need to access the user data that was tracked
              // Extract the custom data from the presence object
              const userData = presence as unknown as PresenceUserStatus;
              
              if (userData && userData.user_id && userIds.includes(userData.user_id)) {
                statusMap[userData.user_id] = {
                  isOnline: userData.status === 'online',
                  lastActive: userData.online_at
                };
              }
            });
          });
          
          setOnlineStatuses(statusMap);
          setIsLoading(false);
        });
        
        // Handle presence changes (join/leave/sync)
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const newStatusMap: Record<string, UserStatus> = {};
            
            // Initialize all requested userIds with offline status
            userIds.forEach(id => {
              newStatusMap[id] = {
                isOnline: false,
                lastActive: null
              };
            });
            
            Object.keys(state).forEach(key => {
              const presences = state[key];
              presences.forEach(presence => {
                // Extract the custom data from the presence object
                const userData = presence as unknown as PresenceUserStatus;
                
                if (userData && userData.user_id && userIds.includes(userData.user_id)) {
                  newStatusMap[userData.user_id] = {
                    isOnline: userData.status === 'online',
                    lastActive: userData.online_at
                  };
                }
              });
            });
            
            setOnlineStatuses(newStatusMap);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            setOnlineStatuses(prev => {
              const updated = { ...prev };
              
              newPresences.forEach(presence => {
                // Extract the custom data from the presence object
                const userData = presence as unknown as PresenceUserStatus;
                
                if (userData && userData.user_id && userIds.includes(userData.user_id)) {
                  updated[userData.user_id] = {
                    isOnline: userData.status === 'online',
                    lastActive: userData.online_at
                  };
                }
              });
              
              return updated;
            });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            setOnlineStatuses(prev => {
              const updated = { ...prev };
              
              leftPresences.forEach(presence => {
                // Extract the custom data from the presence object
                const userData = presence as unknown as PresenceUserStatus;
                
                if (userData && userData.user_id && userIds.includes(userData.user_id)) {
                  updated[userData.user_id] = {
                    isOnline: false,
                    lastActive: userData.online_at
                  };
                }
              });
              
              return updated;
            });
          });
          
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error in fetchStatuses:', error);
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, [userIds.join(',')]);

  const isUserOnline = (userId: string): boolean => {
    return !!onlineStatuses[userId]?.isOnline;
  };

  return { isUserOnline, onlineStatuses, isLoading };
};
