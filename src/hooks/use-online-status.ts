
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Define types for presence data
type PresenceUserStatus = {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  online_at: string;
};

type UserStatus = {
  isOnline: boolean;
  lastActive: string | null;
  status?: 'online' | 'offline' | 'away';
};

export const useOnlineStatus = (userIds: string[] = []) => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, UserStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef(new Date());

  // Track user activity and tab visibility
  useEffect(() => {
    if (!user?.id) return;

    // Reset activity timer
    const resetActivityTimer = () => {
      lastActivityRef.current = new Date();
      if (channelRef.current) {
        updateStatus('online');
      }

      // Clear any existing inactivity timer
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }

      // Set new inactivity timer
      inactivityTimerRef.current = window.setTimeout(() => {
        if (channelRef.current) {
          updateStatus('away');
        }
      }, 300000); // 5 minutes of inactivity = away status
    };

    // Update status based on tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetActivityTimer();
      } else {
        // Tab is hidden
        if (channelRef.current) {
          updateStatus('away');
        }
      }
    };

    // User activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer, true);
    });

    // Tab visibility listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial activity timer
    resetActivityTimer();

    return () => {
      // Remove all event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear the inactivity timer
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user?.id]);

  // Helper function to update user status
  const updateStatus = async (status: 'online' | 'offline' | 'away') => {
    if (!channelRef.current || !user?.id) return;
    
    try {
      const currentTime = new Date().toISOString();
      await channelRef.current.track({
        user_id: user.id,
        online_at: currentTime,
        status: status
      });
      localStorage.setItem('lastActiveTime', currentTime);
      localStorage.setItem('lastStatus', status);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Update current user's online status
  useEffect(() => {
    if (!user?.id) return;

    // When component mounts, set user as online
    const initializePresence = async () => {
      try {
        const currentTime = new Date().toISOString();
        
        // Use presence channels for real-time status tracking
        const channel = supabase.channel('online-users');
        channelRef.current = channel;
        
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track the user's presence when online
            await channel.track({
              user_id: user.id,
              online_at: currentTime,
              status: document.visibilityState === 'visible' ? 'online' : 'away'
            });
            
            // Store last active time in localStorage as fallback
            localStorage.setItem('lastActiveTime', currentTime);
            localStorage.setItem('lastStatus', document.visibilityState === 'visible' ? 'online' : 'away');
          }
        });

        // Update presence state periodically to maintain status
        const pingInterval = setInterval(async () => {
          const newTime = new Date().toISOString();
          
          // Check if user is active or the tab is visible
          const isActive = (new Date().getTime() - lastActivityRef.current.getTime()) < 300000;
          const isVisible = document.visibilityState === 'visible';
          
          let status: 'online' | 'away' | 'offline' = 'offline';
          
          if (isVisible && isActive) {
            status = 'online';
          } else if (isVisible || isActive) {
            status = 'away';
          }
          
          await channel.track({
            user_id: user.id,
            online_at: newTime,
            status: status
          });
          
          localStorage.setItem('lastActiveTime', newTime);
          localStorage.setItem('lastStatus', status);
        }, 30000); // Update every 30 seconds

        // Set up handler for page close/refresh
        const handleBeforeUnload = () => {
          const offlineTime = new Date().toISOString();
          localStorage.setItem('lastOfflineTime', offlineTime);
          localStorage.setItem('lastStatus', 'offline');
          
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
          channelRef.current = null;
        };
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    initializePresence();
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
              lastActive: null,
              status: 'offline'
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
                  lastActive: userData.online_at,
                  status: userData.status
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
                lastActive: null,
                status: 'offline'
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
                    lastActive: userData.online_at,
                    status: userData.status
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
                    lastActive: userData.online_at,
                    status: userData.status
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
                    lastActive: userData.online_at,
                    status: 'offline'
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

  const getUserStatus = (userId: string): 'online' | 'away' | 'offline' => {
    return onlineStatuses[userId]?.status || 'offline';
  };

  return { isUserOnline, getUserStatus, onlineStatuses, isLoading };
};
