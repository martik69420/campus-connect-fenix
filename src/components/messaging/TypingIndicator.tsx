import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface TypingIndicatorProps {
  receiverId: string;
  onTypingChange?: (isTyping: boolean) => void;
}

interface TypingUser {
  user_id: string;
  username: string;
  display_name: string;
  updated_at: string;
}

const TypingIndicator = forwardRef<any, TypingIndicatorProps>(({ receiverId, onTypingChange }, ref) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  // Function to update typing status
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user || !receiverId) return;

    try {
      const channelName = `typing_indicators_${[user.id, receiverId].sort().join('_')}`;
      const channel = supabase.channel(channelName);
      
      if (isTyping) {
        // Start typing
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              username: user.username || user.email?.split('@')[0] || '',
              display_name: user.displayName || user.username || user.email?.split('@')[0] || '',
              typing_to: receiverId,
              updated_at: new Date().toISOString()
            });
          }
        });
      } else {
        // Stop typing
        await channel.untrack();
        supabase.removeChannel(channel);
      }
      
      onTypingChange?.(isTyping);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user, receiverId, onTypingChange]);

  // Handle typing trigger
  const handleTyping = useCallback(() => {
    updateTypingStatus(true);
    
    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [updateTypingStatus]);

  // Expose handleTyping method to parent
  useImperativeHandle(ref, () => ({
    handleTyping
  }), [handleTyping]);

  // Listen for typing indicators from others
  useEffect(() => {
    if (!user || !receiverId) return;

    const channelName = `typing_indicators_${[user.id, receiverId].sort().join('_')}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id === receiverId && presence.typing_to === user.id) {
              typing.push({
                user_id: presence.user_id,
                username: presence.username,
                display_name: presence.display_name,
                updated_at: presence.updated_at
              });
            }
          });
        });
        
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const relevantUsers = newPresences
          .filter((presence: any) => 
            presence.user_id === receiverId && presence.typing_to === user.id
          )
          .map((presence: any) => ({
            user_id: presence.user_id,
            username: presence.username,
            display_name: presence.display_name,
            updated_at: presence.updated_at
          }));
        
        if (relevantUsers.length > 0) {
          setTypingUsers(prev => {
            // Prevent duplicates
            const filtered = prev.filter(u => !relevantUsers.some(r => r.user_id === u.user_id));
            return [...filtered, ...relevantUsers];
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftUserIds = leftPresences.map((p: any) => p.user_id);
        setTypingUsers(prev => prev.filter(u => !leftUserIds.includes(u.user_id)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, receiverId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>
          {typingUsers.length === 1 
            ? `${typingUsers[0].username} is typing...`
            : `${typingUsers.length} people are typing...`
          }
        </span>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export { TypingIndicator };
export type { TypingIndicatorProps };