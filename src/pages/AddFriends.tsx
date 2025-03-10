
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Search, UserPlus, ArrowLeft, School } from 'lucide-react';
import { motion } from 'framer-motion';

const AddFriends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a name or username to search",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Search users by username or display_name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('id', user?.id || ''); // exclude current user
      
      if (error) throw error;
      
      // Get pending requests to check status
      const { data: sentRequests, error: requestsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user?.id)
        .eq('status', 'pending');
        
      if (requestsError) throw requestsError;
      
      // Get existing friends to exclude them
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user?.id)
        .eq('status', 'friends');
        
      if (friendsError) throw friendsError;
      
      // Convert to Set for O(1) lookups
      const pendingIds = new Set(sentRequests?.map(r => r.friend_id) || []);
      const friendIds = new Set(friendsData?.map(f => f.friend_id) || []);
      
      // Update state with pending status
      const pendingMap: Record<string, boolean> = {};
      sentRequests?.forEach(request => {
        pendingMap[request.friend_id] = true;
      });
      setPendingRequests(pendingMap);
      
      // Filter out existing friends from results
      const filteredResults = data?.filter(profile => !friendIds.has(profile.id)) || [];
      setSearchResults(filteredResults);
      
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendRequest = async (profileId: string) => {
    if (!user) return;
    
    try {
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', profileId);
        
      if (checkError) throw checkError;
      
      if (existingRequest && existingRequest.length > 0) {
        toast({
          title: "Request exists",
          description: "You've already sent a request to this user",
        });
        return;
      }
      
      // Send friend request
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: profileId,
          status: 'pending'
        });
        
      if (error) throw error;
      
      // Update UI state
      setPendingRequests(prev => ({
        ...prev,
        [profileId]: true
      }));
      
      toast({
        title: "Request sent",
        description: "Friend request sent successfully",
      });
      
    } catch (error: any) {
      console.error('Send request error:', error);
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/friends')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Friends</h1>
            <p className="text-muted-foreground">Find and connect with people from your school</p>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Friends</CardTitle>
            <CardDescription>Search by name or username</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search for people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((profile) => (
                  <motion.div 
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {profile.display_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{profile.display_name}</h3>
                        <div className="text-sm text-muted-foreground">@{profile.username}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <School className="h-3 w-3 mr-1" />
                          {profile.school}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile/${profile.username}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant={pendingRequests[profile.id] ? "secondary" : "default"}
                        size="sm"
                        disabled={pendingRequests[profile.id]}
                        onClick={() => handleSendRequest(profile.id)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {pendingRequests[profile.id] ? "Request Sent" : "Add Friend"}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {searchTerm && searchResults.length === 0 && !loading && (
          <div className="text-center py-10 border rounded-lg">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-muted-foreground mt-1">
              We couldn't find anyone matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AddFriends;
