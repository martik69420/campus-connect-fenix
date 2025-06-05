
import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface PostViewCounterProps {
  postId: string;
  initialViews?: number;
}

const PostViewCounter: React.FC<PostViewCounterProps> = ({ postId, initialViews = 0 }) => {
  const [viewCount, setViewCount] = useState(initialViews);
  const [hasViewed, setHasViewed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const recordView = async () => {
      if (!user || hasViewed) return;

      try {
        // Check if user has already viewed this post
        const { data: existingView, error: checkError } = await supabase
          .from('post_views')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing view:', checkError);
          return;
        }

        if (!existingView) {
          // Record the view
          const { error: insertError } = await supabase
            .from('post_views')
            .insert([{
              post_id: postId,
              user_id: user.id
            }]);

          if (!insertError) {
            setViewCount(prev => prev + 1);
            setHasViewed(true);
          } else {
            console.error('Error recording post view:', insertError);
          }
        } else {
          setHasViewed(true);
        }
      } catch (error) {
        console.error('Error recording post view:', error);
      }
    };

    // Record view after a short delay to ensure user actually sees the post
    const timer = setTimeout(recordView, 1000);
    return () => clearTimeout(timer);
  }, [postId, user, hasViewed]);

  useEffect(() => {
    // Fetch current view count
    const fetchViewCount = async () => {
      try {
        const { data, error } = await supabase
          .from('post_views')
          .select('id')
          .eq('post_id', postId);

        if (!error && data) {
          setViewCount(data.length);
        } else if (error) {
          console.error('Error fetching view count:', error);
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
      }
    };

    fetchViewCount();
  }, [postId]);

  return (
    <div className="flex items-center gap-1 text-muted-foreground text-sm">
      <Eye className="h-4 w-4" />
      <span>{viewCount}</span>
    </div>
  );
};

export default PostViewCounter;
