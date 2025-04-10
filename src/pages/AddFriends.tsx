import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { UserPlus, UserCheck, UserX, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AddFriends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleSearch = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to search for users.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setSearchResults([]);
    
    try {
      // First, search for users by username
      let { data: usernameResults, error: usernameError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchTerm}%`)
        .neq('id', user.id); // Exclude the current user
        
      if (usernameError) {
        console.error("Error searching by username:", usernameError);
        throw usernameError;
      }
      
      // Next, search for users by display name
      let { data: displayNameResults, error: displayNameError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${searchTerm}%`)
        .neq('id', user.id); // Exclude the current user
        
      if (displayNameError) {
        console.error("Error searching by display name:", displayNameError);
        throw displayNameError;
      }
      
      // Combine the results, removing duplicates
      const combinedResults = [...(usernameResults || []), ...(displayNameResults || [])];
      const uniqueResults = Array.from(new Set(combinedResults.map(a => a.id)))
        .map(id => {
          return combinedResults.find(a => a.id === id);
        });
        
      setSearchResults(uniqueResults as any[]);
      
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddFriend = async (friendId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to send friend requests.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Check if a friend request already exists
      const { data: existingRequest, error: existingError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},and(friend_id.eq.${user.id},user_id.eq.${friendId}),friend_id.eq.${friendId}`)
        .limit(1);
        
      if (existingError) {
        console.error("Error checking existing request:", existingError);
        throw existingError;
      }
      
      if (existingRequest && existingRequest.length > 0) {
        toast({
          title: "Request exists",
          description: "A friend request has already been sent to this user.",
          variant: "destructive"
        });
        return;
      }
      
      // Send friend request
      const { data, error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: friendId, status: 'pending' },
        ]);
        
      if (error) {
        console.error("Error sending friend request:", error);
        throw error;
      }
      
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent.",
      });
      
      // Optimistically update the search results to reflect the sent request
      setSearchResults(prevResults =>
        prevResults.map(result =>
          result.id === friendId ? { ...result, requestSent: true } : result
        )
      );
      
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Failed to send request",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Add Friends</h1>
            <p className="text-muted-foreground">Find people from your school and connect with them</p>
          </div>
          <Button onClick={() => navigate('/friends')}>
            <UserCheck className="mr-2 h-4 w-4" />
            View Friends
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Search for Friends</CardTitle>
            <CardDescription>Enter a username or display name to find people</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center">
                <Input
                  type="search"
                  placeholder="Search by username or display name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  className="ml-2"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <motion.div 
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={result.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {result.display_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{result.display_name}</h3>
                          <p className="text-sm text-muted-foreground">@{result.username}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddFriend(result.id)}
                        disabled={result.requestSent}
                      >
                        {result.requestSent ? (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Friend
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                searchTerm && (
                  <div className="text-center py-10">
                    <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground mt-1">
                      Try searching for a different username or display name
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AddFriends;
