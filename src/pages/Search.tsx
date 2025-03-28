
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, User, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/post/PostCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch (error) {
    return new Date();
  }
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') || 'users';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  
  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Update URL params
      setSearchParams({ q: query, tab: activeTab });
      
      if (activeTab === 'users' || activeTab === 'all') {
        // Search users
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, username, display_name, school, avatar_url, bio')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,school.ilike.%${query}%`)
          .limit(20);
          
        if (userError) throw userError;
        
        // Filter out blocked users
        let filteredUsers = userData || [];
        
        if (user) {
          const { data: blockedUsers } = await supabase
            .from('user_blocks')
            .select('blocked_user_id')
            .eq('user_id', user.id);
            
          if (blockedUsers && blockedUsers.length > 0) {
            const blockedIds = blockedUsers.map(block => block.blocked_user_id);
            filteredUsers = filteredUsers.filter(u => !blockedIds.includes(u.id));
          }
        }
        
        setUserResults(filteredUsers);
      }
      
      if (activeTab === 'posts' || activeTab === 'all') {
        // Search posts
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            id, 
            content, 
            created_at, 
            images, 
            user_id,
            profiles:user_id(username, display_name, avatar_url),
            likes:likes(id),
            comments:comments(id)
          `)
          .ilike('content', `%${query}%`)
          .limit(20);
          
        if (postError) throw postError;
        
        // Filter out posts from blocked users
        let filteredPosts = postData || [];
        
        if (user) {
          const { data: blockedUsers } = await supabase
            .from('user_blocks')
            .select('blocked_user_id')
            .eq('user_id', user.id);
            
          if (blockedUsers && blockedUsers.length > 0) {
            const blockedIds = blockedUsers.map(block => block.blocked_user_id);
            filteredPosts = filteredPosts.filter(p => !blockedIds.includes(p.user_id));
          }
        }
        
        setPostResults(filteredPosts);
      }
      
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ q: searchQuery, tab: value });
    
    // Re-search if query exists
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };
  
  // Initial search if there's a query in the URL
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, []);
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        
        {/* Search input */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search users, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
              Search
            </Button>
          </div>
        </form>
        
        {/* Search results */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            {isSearching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userResults.length > 0 ? (
              userResults.map(profile => (
                <Card key={profile.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.display_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${profile.username}`}>
                          <h3 className="text-lg font-semibold truncate hover:text-primary">
                            {profile.display_name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <p className="text-sm">{profile.school}</p>
                      </div>
                      
                      <Button size="sm" asChild>
                        <Link to={`/profile/${profile.username}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                    
                    {profile.bio && (
                      <p className="mt-2 text-sm line-clamp-2">{profile.bio}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : searchQuery ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
              </div>
            ) : null}
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-6">
            {isSearching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : postResults.length > 0 ? (
              postResults.map(post => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    userId: post.user_id,
                    content: post.content,
                    images: post.images || [],
                    createdAt: safeParseDate(post.created_at),
                    likes: post.likes.map((like: any) => like.id),
                    comments: post.comments || [],
                    shares: 0
                  }}
                  onAction={() => performSearch(searchQuery)}
                />
              ))
            ) : searchQuery ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No posts found matching "{searchQuery}"</p>
              </div>
            ) : null}
          </TabsContent>
          
          <TabsContent value="all">
            {isSearching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {userResults.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Users</h2>
                    <div className="space-y-4">
                      {userResults.slice(0, 5).map(profile => (
                        <Card key={profile.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback>
                                  {profile.display_name.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <Link to={`/profile/${profile.username}`}>
                                  <h3 className="text-lg font-semibold truncate hover:text-primary">
                                    {profile.display_name}
                                  </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                              </div>
                              
                              <Button size="sm" asChild>
                                <Link to={`/profile/${profile.username}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {userResults.length > 5 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" onClick={() => handleTabChange('users')}>
                          See all {userResults.length} users
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {postResults.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Posts</h2>
                    <div className="space-y-6">
                      {postResults.slice(0, 3).map(post => (
                        <PostCard
                          key={post.id}
                          post={{
                            id: post.id,
                            userId: post.user_id,
                            content: post.content,
                            images: post.images || [],
                            createdAt: safeParseDate(post.created_at),
                            likes: post.likes.map((like: any) => like.id),
                            comments: post.comments || [],
                            shares: 0
                          }}
                          onAction={() => performSearch(searchQuery)}
                        />
                      ))}
                    </div>
                    
                    {postResults.length > 3 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" onClick={() => handleTabChange('posts')}>
                          See all {postResults.length} posts
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {userResults.length === 0 && postResults.length === 0 && searchQuery && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No results found matching "{searchQuery}"</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Search;
