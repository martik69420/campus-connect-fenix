
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import PostCard from '@/components/post/PostCard';
import CreatePostForm from '@/components/post/CreatePostForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { posts, fetchPosts, loading: postsLoading } = usePost();
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPosts().catch(err => {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
      });
    }
  }, [isAuthenticated, fetchPosts]);

  // Initialize AdSense
  React.useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense initialization error:', e);
    }
  }, []);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your feed...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-3xl px-4">
        <h1 className="text-3xl font-bold mb-6">Campus Feed</h1>

        {/* AdSense Ad at top of feed */}
        <div className="w-full overflow-hidden mb-6">
          <ins className="adsbygoogle w-full"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-3116464894083582"
               data-ad-slot="5082313008"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
        </div>
        
        {isAuthenticated && (
          <>
            <CreatePostForm onPostCreated={fetchPosts} />
            
            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setError(null);
                      fetchPosts();
                    }}
                  >
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {postsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <React.Fragment key={post.id}>
                    <PostCard 
                      post={post} 
                      onAction={fetchPosts}
                    />
                    
                    {/* Insert an ad after every 3rd post */}
                    {index > 0 && (index + 1) % 3 === 0 && (
                      <div className="w-full overflow-hidden my-4">
                        <ins className="adsbygoogle w-full"
                             style={{ display: 'block' }}
                             data-ad-format="fluid"
                             data-ad-layout-key="-gw-3+1f-3d+2z"
                             data-ad-client="ca-pub-3116464894083582"
                             data-ad-slot="2813542194">
                        </ins>
                        <script>
                          (adsbygoogle = window.adsbygoogle || []).push({});
                        </script>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium">No posts yet</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to share something with your campus community!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
