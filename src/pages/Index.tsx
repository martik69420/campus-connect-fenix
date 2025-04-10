import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/post/PostList';
import CreatePost from '@/components/post/CreatePost';
import { useAuth } from '@/context/auth';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Campus Feed</h1>
        <CreatePost />
        <PostList />
      </div>
    </AppLayout>
  );
};

export default Index;
