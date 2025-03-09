import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Post } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostCard from '@/components/post/PostCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'professional'>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          images,
          is_professional,
          created_at,
          profiles (
            username,
            display_name,
            avatar_url
          ),
          likes: likes(id),
          comments: comments(id)
        `)
        .order('created_at', { ascending: false });
      
      if (feedType === 'professional') {
        query = query.eq('is_professional', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Explicitly cast the data to the Post type
      const typedPosts = (data || []) as unknown as Post[];
      setPosts(typedPosts);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingPosts(false);
    }
  };

  const refreshFeed = () => {
    fetchPosts();
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4">
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFeedType(value as 'all' | 'professional')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" onClick={refreshFeed} disabled={loadingPosts}>
              <RefreshCw className={`h-5 w-5 ${loadingPosts ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <CreatePostForm onPostCreated={refreshFeed as any} />
          
          <TabsContent value="all" className="mt-6 space-y-6">
            {loadingPosts ? (
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
              posts.map((post) => <PostCard key={post.id} post={post as any} onAction={refreshFeed} />)
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-muted-foreground mt-1">Be the first to post something!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="professional" className="mt-6 space-y-6">
            {loadingPosts ? (
              Array.from({ length: 2 }).map((_, i) => (
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
            ) : posts.filter(p => p.is_professional).length > 0 ? (
              posts.filter(p => p.is_professional).map((post) => (
                <PostCard key={post.id} post={post as any} onAction={refreshFeed} />
              ))
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No professional posts yet</h3>
                <p className="text-muted-foreground mt-1">Share your professional achievements and insights!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Index;
