
import React, { useState, useEffect, useCallback } from 'react';
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
import FriendsForYou from '@/components/users/FriendsForYou';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Add window.adsbygoogle type declaration if not already defined
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { posts, isLoading: postsLoading, fetchPosts } = usePost();
  const [activeTab, setActiveTab] = useState('for-you');
  const [forYouPosts, setForYouPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const { toast } = useToast();

  // Authentication check with recovery mechanism
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login');
      } else {
        console.log('User authenticated:', user?.username);
      }
    }
  }, [isAuthenticated, authLoading, navigate, user]);

  // Fetch posts with error handling and retry mechanism
  const loadPosts = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoadError(null);
      try {
        console.log(`Fetching ${activeTab === 'for-you' ? 'feed' : 'latest'} posts`);
        await fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoadError("Failed to load posts. Please try refreshing.");
        
        // Show toast for error visibility
        toast({
          title: "Failed to load posts",
          description: "We couldn't retrieve your posts. Please try refreshing.",
          variant: "destructive",
        });
      }
    }
  }, [isAuthenticated, user, activeTab, fetchPosts, toast]);
  
  // Initial posts loading
  useEffect(() => {
    let isMounted = true;
    
    if (isAuthenticated && user && !postsLoading && loadAttempts < 3) {
      setLoadAttempts(prev => prev + 1);
      loadPosts();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, loadPosts, postsLoading, loadAttempts]);

  // Process posts when they're loaded
  useEffect(() => {
    if (!postsLoading && posts) {
      if (activeTab === 'for-you') {
        // For "For You" tab, we might prioritize posts from friends or with more engagement
        const sortedPosts = [...posts].sort((a, b) => 
          (b.likes.length + b.comments.length * 2) - (a.likes.length + a.comments.length * 2)
        );
        setForYouPosts(sortedPosts);
      } else {
        // For "Latest" tab, we simply sort by date
        const sortedPosts = [...posts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLatestPosts(sortedPosts);
      }
    }
  }, [posts, postsLoading, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      await fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
    } catch (error) {
      console.error("Error refreshing posts:", error);
      setLoadError("Failed to refresh posts. Please try again.");
    } finally {
      // Always end refreshing state after a short delay for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  // Emergency recovery for persistent loading states
  useEffect(() => {
    const recoveryTimer = setTimeout(() => {
      // If we're still loading after 10 seconds, attempt recovery
      if ((authLoading || postsLoading) && !loadError) {
        console.error("Detected prolonged loading state, attempting recovery");
        setLoadError("Loading is taking longer than expected");
        // Force refresh component state
        setLoadAttempts(0);
      }
    }, 10000);
    
    return () => clearTimeout(recoveryTimer);
  }, [authLoading, postsLoading, loadError]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const displayedPosts = activeTab === 'for-you' ? forYouPosts : latestPosts;
  const emptyMessage = activeTab === 'for-you' 
    ? "Your personalized feed is empty" 
    : "No recent posts found";

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - Friends For You */}
          <div className="hidden md:block">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <FriendsForYou />
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            {user && (
              <Card className="mb-6 shadow-md border-primary/10 overflow-hidden">
                <CardContent className="p-4">
                  <PostForm />
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="for-you" onValueChange={handleTabChange}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid grid-cols-2 w-[300px]">
                  <TabsTrigger value="for-you" className="text-sm">
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="latest" className="text-sm">
                    Latest
                  </TabsTrigger>
                </TabsList>
                <motion.div whileTap={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn("gap-2", isRefreshing && "opacity-70")}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4", 
                      isRefreshing && "animate-spin"
                    )} />
                    Refresh
                  </Button>
                </motion.div>
              </div>
              
              {loadError && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="flex-1">{loadError}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh} 
                    className="ml-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              <Separator className="mb-4" />
              <TabsContent value="for-you" className="focus-visible:outline-none">
                <PostList 
                  posts={displayedPosts} 
                  isLoading={postsLoading || isRefreshing} 
                  emptyMessage={emptyMessage}
                />
              </TabsContent>
              <TabsContent value="latest" className="focus-visible:outline-none">
                <PostList 
                  posts={displayedPosts} 
                  isLoading={postsLoading || isRefreshing} 
                  emptyMessage={emptyMessage}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* AdSense banner */}
        <AdBanner adSlot="2813542194" className="mt-8" />
      </div>
    </AppLayout>
  );
};

export default Index;
