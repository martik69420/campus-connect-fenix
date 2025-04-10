import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/layout/AppLayout';
import PostForm from '@/components/posts/PostForm';
import PostList from '@/components/posts/PostList';
import UserSuggestions from '@/components/users/UserSuggestions';
import TrendingTopics from '@/components/posts/TrendingTopics';
import { Loader2 } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { posts, isLoading: postsLoading, fetchPosts } = usePost();
  const [activeTab, setActiveTab] = useState('for-you');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
    }
  }, [isAuthenticated, user, activeTab, fetchPosts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        {/* Update AdSense banner */}
        <AdBanner adSlot="5082313008" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="hidden md:block">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <TrendingTopics />
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            {user && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <PostForm />
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="for-you" onValueChange={handleTabChange}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="for-you">For You</TabsTrigger>
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" onClick={() => fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest')}>
                  Refresh
                </Button>
              </div>
              <Separator className="mb-4" />
              <TabsContent value="for-you">
                <PostList posts={posts} isLoading={postsLoading} />
              </TabsContent>
              <TabsContent value="latest">
                <PostList posts={posts} isLoading={postsLoading} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <UserSuggestions />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Update AdSense banner */}
        <AdBanner adSlot="2813542194" className="mt-8" />
      </div>
    </AppLayout>
  );
};

export default Index;
