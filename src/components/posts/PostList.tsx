
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostListProps {
  posts: any[];
  isLoading: boolean;
}

const PostList: React.FC<PostListProps> = ({ posts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-lg font-medium mb-2">No posts yet</p>
          <p className="text-muted-foreground">
            Be the first to post something or follow other users to see their posts here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  {post.user?.avatar && (
                    <img 
                      src={post.user.avatar} 
                      alt={post.user?.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{post.user?.displayName || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p>{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="mt-3 grid gap-2 grid-cols-2">
                        {post.images.map((image: string, i: number) => (
                          <img 
                            key={i}
                            src={image} 
                            alt={`Post image ${i + 1}`} 
                            className="rounded-md w-full h-32 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button className="text-sm text-muted-foreground flex items-center gap-1">
                      {post.likes?.length || 0} Likes
                    </button>
                    <button className="text-sm text-muted-foreground flex items-center gap-1">
                      {post.comments?.length || 0} Comments
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PostList;
