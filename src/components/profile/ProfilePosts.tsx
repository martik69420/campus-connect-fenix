
import React, { useEffect, useState } from 'react';
import { usePost } from '@/context/PostContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfilePostsProps {
  username?: string;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ username }) => {
  const { posts, fetchPosts, isLoading } = usePost();
  const [userPosts, setUserPosts] = useState<Array<any>>([]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts && posts.length > 0 && username) {
      const filteredPosts = posts.filter(post => 
        post.user?.username === username
      );
      setUserPosts(filteredPosts);
    }
  }, [posts, username]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          {username ? `@${username} hasn't posted anything yet.` : 'No posts to display.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {userPosts.map((post) => (
        <Card key={post.id} className="mb-4">
          <CardContent className="p-4">
            <p className="mb-2">{post.content}</p>
            <p className="text-sm text-muted-foreground">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfilePosts;
