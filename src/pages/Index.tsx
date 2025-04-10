
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import PostCard from '@/components/post/PostCard';
import CreatePostForm from '@/components/post/CreatePostForm';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { posts, fetchPosts, loading: postsLoading } = usePost();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, fetchPosts]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Campus Feed</h1>
        
        {isAuthenticated && (
          <>
            <CreatePostForm onPostCreated={fetchPosts} />
            
            {postsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onAction={fetchPosts}
                  />
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
