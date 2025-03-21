
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostCard from '@/components/post/PostCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { fetchPosts, posts } = usePost();
  
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const refreshFeed = () => {
    setLoadingPosts(true);
    fetchPosts()
      .finally(() => setLoadingPosts(false));
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Feed</h2>
          <Button variant="ghost" size="icon" onClick={refreshFeed} disabled={loadingPosts}>
            <RefreshCw className={`h-5 w-5 ${loadingPosts ? 'animate-spin' : ''}`} />
          </Button>
        </div>
          
        <CreatePostForm onPostCreated={refreshFeed} />
          
        <div className="mt-6 space-y-6">
          {isLoading || loadingPosts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border shadow-sm p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onAction={refreshFeed} 
              />
            ))
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No posts yet</h3>
              <p className="text-muted-foreground mt-1">Be the first to post something!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
