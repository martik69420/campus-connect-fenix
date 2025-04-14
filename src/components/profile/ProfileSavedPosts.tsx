
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth';
import PostItem from '@/components/posts/PostItem';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileSavedPostsProps {
  username: string;
}

const ProfileSavedPosts: React.FC<ProfileSavedPostsProps> = ({ username }) => {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Check if viewing own profile or if the other user has public saved posts
  const [canViewSavedPosts, setCanViewSavedPosts] = useState(false);
  
  useEffect(() => {
    const checkPermissionAndLoadPosts = async () => {
      setIsLoading(true);
      
      try {
        // Check if this is the current user's profile
        const isOwnProfile = user?.username === username;
        
        // If it's not the user's own profile, check if the profile has public saved posts
        let hasPublicSavedPosts = false;
        if (!isOwnProfile) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('settings')
            .eq('username', username)
            .single();
            
          hasPublicSavedPosts = profileData?.settings?.publicSavedPosts || false;
        }
        
        // Set permission based on ownership or public setting
        const hasPermission = isOwnProfile || hasPublicSavedPosts;
        setCanViewSavedPosts(hasPermission);
        
        if (hasPermission) {
          // Get userId for the username
          const { data: userData } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();
            
          if (userData) {
            // Fetch saved posts
            const { data: savedItems } = await supabase
              .from('saved_posts')
              .select('post_id')
              .eq('user_id', userData.id);
              
            if (savedItems && savedItems.length > 0) {
              const postIds = savedItems.map(saved => saved.post_id);
              
              // Fetch the actual posts with user data
              const { data: posts } = await supabase
                .from('posts')
                .select(`
                  *,
                  profiles:user_id (username, display_name, avatar_url),
                  likes:likes (user_id),
                  comments:comments (*)
                `)
                .in('id', postIds)
                .order('created_at', { ascending: false });
                
              setSavedPosts(posts || []);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      checkPermissionAndLoadPosts();
    }
  }, [username, user]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!canViewSavedPosts) {
    return (
      <div className="text-center py-10">
        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Saved posts are private</h3>
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">
          This user has set their saved posts to private.
        </p>
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-10">
        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No saved posts yet</h3>
        <p className="text-muted-foreground mt-1">
          Saved posts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedPosts.map(post => (
        <PostItem 
          key={post.id} 
          post={post} 
          showControls={false} 
        />
      ))}
    </div>
  );
};

export default ProfileSavedPosts;
