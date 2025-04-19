
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import PostForm from '@/components/posts/PostForm';
import PostList from '@/components/posts/PostList';
import FriendsForYou from '@/components/users/FriendsForYou';
import { Loader2, RefreshCw, AlertCircle, TrendingUp, Clock, UserPlus } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useViewport } from '@/hooks/use-viewport';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { MentionsProvider } from '@/components/common/MentionsProvider';

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
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useViewport();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch posts with error handling
  const loadPosts = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoadError(null);
      try {
        await fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoadError("Failed to load posts. Please try refreshing.");
        
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
    let mounted = true;
    
    if (isAuthenticated && user && !postsLoading && !posts.length) {
      loadPosts();
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user, loadPosts, postsLoading, posts]);

  // Force friends data to load immediately
  useEffect(() => {
    if (isAuthenticated && user && !friendsLoaded) {
      setFriendsLoaded(true);
    }
  }, [isAuthenticated, user, friendsLoaded]);

  // Process posts when they're loaded
  useEffect(() => {
    if (!postsLoading && posts.length > 0) {
      if (activeTab === 'for-you') {
        const sortedPosts = [...posts].sort((a, b) => 
          (b.likes.length + b.comments.length * 2) - (a.likes.length + a.comments.length * 2)
        );
        setForYouPosts(sortedPosts);
      } else {
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
    <MentionsProvider>
      <div className="container mx-auto py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left sidebar - Friends For You and Admin Features */}
          <div className="hidden md:flex md:flex-col gap-6">
            <Card className="sticky top-20 overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-2">
                <CardTitle className="flex items-center text-lg">
                  <UserPlus className="h-5 w-5 mr-2 text-primary" />
                  People You May Know
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <FriendsForYou key={`friends-${friendsLoaded ? 'loaded' : 'loading'}`} />
              </CardContent>
            </Card>
            
            {user?.isAdmin && (
              <Card className="overflow-hidden border-primary/10 shadow-sm">
                <CardContent className="p-4">
                  <AdminFeatures />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            {user && (
              <Card className="mb-4 md:mb-6 shadow-md border-primary/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
                  <CardTitle className="text-lg">Create Post</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <PostForm />
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="for-you" onValueChange={handleTabChange}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid grid-cols-2 w-[200px] md:w-[300px]">
                  <TabsTrigger value="for-you" className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="latest" className="text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Latest
                  </TabsTrigger>
                </TabsList>
                <motion.div whileTap={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"} 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn("gap-2", isRefreshing && "opacity-70")}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4", 
                      isRefreshing && "animate-spin"
                    )} />
                    {!isMobile && "Refresh"}
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
    </MentionsProvider>
  );
};

export default Index;
