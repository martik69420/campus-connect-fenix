
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, UserRound, MessageSquare, UserX, ShieldAlert, Bookmark, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  useEffect(() => {
    // Set initial query from URL params
    if (searchParams.get('q')) {
      setQuery(searchParams.get('q') || '');
      handleSearch(searchParams.get('q') || '');
    }
    
    // Fetch blocked users
    if (user?.id) {
      fetchBlockedUsers();
    }
  }, [searchParams, user?.id]);
  
  const fetchBlockedUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_user_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setBlockedUsers(data?.map(block => block.blocked_user_id) || []);
    } catch (error: any) {
      console.error('Error fetching blocked users:', error.message);
    }
  };
  
  const handleSearch = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      setPostResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Search for users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchValue}%,display_name.ilike.%${searchValue}%,bio.ilike.%${searchValue}%`)
        .limit(20);
      
      if (userError) throw userError;
      
      // Search for posts
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .ilike('content', `%${searchValue}%`)
        .limit(20);
      
      if (postError) throw postError;
      
      setSearchResults(userData || []);
      setPostResults(postData || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search query
    setSearchParams({ q: query });
    handleSearch(query);
  };
  
  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };
  
  const handlePostClick = (postId: string) => {
    // For future implementation: navigate to the specific post view
    navigate(`/`); // For now, navigate to home
    
    toast({
      title: "Post view",
      description: "Direct post view is coming soon!",
    });
  };
  
  const handleBlockUser = async (userId: string, username: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          user_id: user.id,
          blocked_user_id: userId
        });
        
      if (error) throw error;
      
      // Add blocked user to local state
      setBlockedUsers(prev => [...prev, userId]);
      
      // Filter out the blocked user from results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User blocked",
        description: `You've blocked ${username}. You won't see their content anymore.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to block user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleReportUser = async (userId: string, username: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: 'Reported by user'
        });
        
      if (error) throw error;
      
      toast({
        title: "User reported",
        description: `Thank you for reporting ${username}. We'll review this account.`,
      });
      
      // Notify admins (in a real app)
      addNotification({
        userId: 'admin', // Admin user ID
        type: 'system',
        message: `${user.username} reported user ${username}`,
        relatedId: userId
      });
    } catch (error: any) {
      toast({
        title: "Failed to report user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleReportPost = async (postId: string, userId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('post_reports')
        .insert({
          reporter_id: user.id,
          post_id: postId,
          reason: 'Reported by user'
        });
        
      if (error) throw error;
      
      toast({
        title: "Post reported",
        description: "Thank you for reporting this post. We'll review it.",
      });
      
      // Notify admins (in a real app)
      addNotification({
        userId: 'admin', // Admin user ID
        type: 'system',
        message: `${user.username} reported a post`,
        relatedId: postId
      });
    } catch (error: any) {
      toast({
        title: "Failed to report post",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleSavePost = async (postId: string) => {
    if (!user) return;
    
    try {
      // Check if already saved
      const { data: existingSave, error: checkError } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingSave) {
        // Unsave the post
        const { error: deleteError } = await supabase
          .from('saved_posts')
          .delete()
          .eq('id', existingSave.id);
          
        if (deleteError) throw deleteError;
        
        toast({
          title: "Post unsaved",
          description: "Post has been removed from your saved items.",
        });
        
        // Update UI to reflect the post is no longer saved
        setPostResults(prev => 
          prev.map(post => 
            post.id === postId ? { ...post, is_saved: false } : post
          )
        );
      } else {
        // Save the post
        const { error: saveError } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId
          });
          
        if (saveError) throw saveError;
        
        toast({
          title: "Post saved",
          description: "Post has been added to your saved items.",
        });
        
        // Update UI to reflect the post is now saved
        setPostResults(prev => 
          prev.map(post => 
            post.id === postId ? { ...post, is_saved: true } : post
          )
        );
      }
    } catch (error: any) {
      toast({
        title: "Failed to save post",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="Search for users, posts, or topics..."
            value={query}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button type="submit" variant="default">
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map(user => (
                  <Card key={user.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-4 cursor-pointer flex-1"
                          onClick={() => handleUserClick(user.username)}
                        >
                          <Avatar>
                            <AvatarImage src={user.avatar_url} alt={user.display_name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.display_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.display_name}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        
                        {user.id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <UserRound className="h-4 w-4 mr-2" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/messages?userId=${user.id}`)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleReportUser(user.id, user.username)}>
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Report User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBlockUser(user.id, user.username)}>
                                <UserX className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-12">
                <UserRound className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground mt-1">
                  Try searching for a different username or display name
                </p>
              </div>
            ) : null}
          </TabsContent>
          
          <TabsContent value="posts">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : postResults.length > 0 ? (
              <div className="space-y-4">
                {postResults.map(post => (
                  <Card key={post.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar 
                          className="cursor-pointer"
                          onClick={() => handleUserClick(post.profiles.username)}
                        >
                          <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.display_name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {post.profiles.display_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 
                            className="font-medium cursor-pointer"
                            onClick={() => handleUserClick(post.profiles.username)}
                          >
                            {post.profiles.display_name}
                          </h3>
                          <p 
                            className="text-sm text-muted-foreground cursor-pointer"
                            onClick={() => handleUserClick(post.profiles.username)}
                          >
                            @{post.profiles.username}
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className="cursor-pointer mb-4"
                        onClick={() => handlePostClick(post.id)}
                      >
                        <p className="text-sm">{post.content}</p>
                        {post.images && post.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {post.images.map((image: string, idx: number) => (
                              <img 
                                key={idx} 
                                src={image} 
                                alt="Post image" 
                                className="rounded-md object-cover w-full h-32"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            {new Date(post.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSavePost(post.id)}
                            className={post.is_saved ? "text-yellow-500" : ""}
                          >
                            <Bookmark 
                              className={`h-4 w-4 mr-2 ${post.is_saved ? "fill-yellow-500 text-yellow-500" : ""}`} 
                            />
                            {post.is_saved ? "Saved" : "Save"}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportPost(post.id, post.user_id)}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No posts found</h3>
                <p className="text-muted-foreground mt-1">
                  Try searching for different keywords
                </p>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Search;
