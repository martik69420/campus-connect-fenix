
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, UserCheck, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';

const AddFriends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/login');
      return;
    }
    
    // Load sent friend requests and recommendations on component mount
    if (user) {
      fetchSentRequests();
      fetchRecommendations();
    }
  }, [isAuthenticated, authLoading, navigate, user]);
  
  const fetchSentRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (error) {
        console.error("Error fetching sent requests:", error);
        return;
      }
      
      // Create a map of friend IDs to quickly check if a request has been sent
      const requestMap: {[key: string]: boolean} = {};
      data?.forEach(item => {
        requestMap[item.friend_id] = true;
      });
      
      setSentRequests(requestMap);
      
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  const fetchRecommendations = async () => {
    if (!user) return;
    
    try {
      // Get 5 random users from same class for recommendations
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, class')
        .eq('class', user.class || '')
        .neq('id', user.id)
        .limit(5);
        
      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      
      // Mark already sent requests
      const recommendationsWithStatus = data?.map(result => ({
        ...result,
        requestSent: sentRequests[result.id] || false
      })) || [];
      
      setRecommendations(recommendationsWithStatus);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };
  
  const handleSearch = async () => {
    if (!user || !searchTerm.trim()) {
      if (!searchTerm.trim()) {
        toast({
          title: "Please enter a search term",
          description: "Type a username or display name to find people",
          variant: "destructive"
        });
      }
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
        
      // Mark already sent requests
      const resultsWithStatus = uniqueResults.map(result => ({
        ...result,
        requestSent: sentRequests[result.id] || false
      }));
      
      setSearchResults(resultsWithStatus as any[]);
      
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
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(friend_id.eq.${user.id},user_id.eq.${friendId})`)
        .limit(1);
        
      if (existingError) {
        console.error("Error checking existing request:", existingError);
        throw existingError;
      }
      
      if (existingRequest && existingRequest.length > 0) {
        toast({
          title: "Request exists",
          description: "A friend request already exists between you and this user.",
          variant: "destructive"
        });
        return;
      }
      
      // Send friend request
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: friendId, status: 'pending' },
        ]);
        
      if (error) {
        console.error("Error sending friend request:", error);
        throw error;
      }
      
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
      
      // Update sent requests
      setSentRequests(prev => ({
        ...prev,
        [friendId]: true
      }));
      
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

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vrienden Zoeken</h1>
            <p className="text-muted-foreground">Verbind met mensen uit je klas en breid je netwerk uit</p>
          </div>
          <Button onClick={() => navigate('/friends')} className="bg-primary hover:bg-primary/90">
            <UserCheck className="mr-2 h-4 w-4" />
            Bekijk Vrienden
          </Button>
        </div>
        
        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Aanbevelingen uit je Klas</CardTitle>
              <CardDescription>Mensen uit jouw klas die je zou kunnen kennen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((person) => (
                  <motion.div 
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={person.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {person.display_name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{person.display_name}</h3>
                        <p className="text-sm text-muted-foreground">@{person.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={person.requestSent ? "outline" : "default"}
                        size="sm"
                        onClick={() => !person.requestSent && handleAddFriend(person.id)}
                        disabled={person.requestSent}
                        className={person.requestSent ? "border-green-500/30 text-green-500" : ""}
                      >
                        {person.requestSent ? (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Verzoek Verzonden
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Voeg Toe
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile/${person.username}`)}
                      >
                        Bekijk Profiel
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Zoek naar Vrienden</CardTitle>
            <CardDescription>Voer een gebruikersnaam of weergavenaam in om mensen te vinden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex items-center mt-2">
                <Input
                  type="search"
                  placeholder="Zoek op gebruikersnaam of weergavenaam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="rounded-r-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button 
                  className="ml-0 rounded-l-none"
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Zoeken
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <AnimatePresence>
                  {searchResults.length > 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {searchResults.map((result, index) => (
                        <motion.div 
                          key={result.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={result.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {result.display_name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{result.display_name}</h3>
                              <p className="text-sm text-muted-foreground">@{result.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant={result.requestSent ? "outline" : "default"}
                              size="sm"
                              onClick={() => !result.requestSent && handleAddFriend(result.id)}
                              disabled={result.requestSent}
                              className={result.requestSent ? "border-green-500/30 text-green-500" : ""}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/profile/${result.username}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : searchTerm && !loading && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-center py-10"
                    >
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No users found</h3>
                      <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                        We couldn't find any users matching "{searchTerm}". Try using a different name or username.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AddFriends;
