
import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { User, UserPlus, UserCheck, UserX, Users, MessageCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Optimized lazy loading for later sections
const FriendRequestsTab = lazy(() => import('@/components/friends/FriendRequestsTab'));
const SentRequestsTab = lazy(() => import('@/components/friends/SentRequestsTab'));

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchFriends();
    }
  }, [user, isAuthenticated, isLoading, navigate]);
  
  const fetchFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Execute all queries in parallel for performance
      const [friendsResponse, reverseFriendsResponse, receivedResponse, sentResponse] = await Promise.all([
        // Get friends where user is user_id
        supabase.from('friends')
          .select('id, status, created_at, friend_id, profiles:friend_id (*)')
          .eq('user_id', user.id)
          .eq('status', 'friends'),
          
        // Get friends where user is friend_id
        supabase.from('friends')
          .select('id, status, created_at, user_id, profiles:user_id (*)')
          .eq('friend_id', user.id)
          .eq('status', 'friends'),
          
        // Get pending requests received
        supabase.from('friends')
          .select('id, status, created_at, user_id, profiles:user_id (*)')
          .eq('friend_id', user.id)
          .eq('status', 'pending'),
          
        // Get pending requests sent
        supabase.from('friends')
          .select('id, status, created_at, friend_id, profiles:friend_id (*)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
      ]);
      
      if (friendsResponse.error) throw friendsResponse.error;
      if (reverseFriendsResponse.error) throw reverseFriendsResponse.error;
      if (receivedResponse.error) throw receivedResponse.error;
      if (sentResponse.error) throw sentResponse.error;
      
      // Combine both friend lists (where user is user_id and where user is friend_id)
      const allFriends = [
        ...(friendsResponse.data || []),
        ...(reverseFriendsResponse.data || []).map(item => ({
          ...item,
          friend_id: item.user_id,
          profiles: item.profiles
        }))
      ];
      
      setFriends(allFriends);
      setPendingRequests(receivedResponse.data || []);
      setSentRequests(sentResponse.data || []);
      
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Failed to load friends",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredFriends = searchTerm 
    ? friends.filter(friend => 
        friend.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.profiles.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : friends;
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'friends' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request accepted" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request declined" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to decline request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);
        
      if (error) throw error;
      
      toast({ title: "Friend removed" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({ title: "Friend request cancelled" });
      fetchFriends();
      
    } catch (error: any) {
      toast({
        title: "Failed to cancel request",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleMessageFriend = (friendId: string) => {
    navigate(`/messages?userId=${friendId}`);
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* AdSense Ad at the top of the page */}
        <div className="w-full overflow-hidden mb-4">
          <ins className="adsbygoogle w-full"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-3116464894083582"
               data-ad-slot="5082313008"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
          <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </div>
      
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Friends</h1>
            <p className="text-muted-foreground">Connect with your campus community</p>
          </div>
          <Button onClick={() => navigate('/add-friends')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friends
          </Button>
        </div>
        
        <Tabs defaultValue="all-friends" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all-friends">
              <Users className="mr-2 h-4 w-4" />
              All Friends
            </TabsTrigger>
            <TabsTrigger value="pending">
              <UserCheck className="mr-2 h-4 w-4" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <UserPlus className="mr-2 h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-friends">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Friends</CardTitle>
                  <div className="relative max-w-xs w-full">
                    <Input
                      placeholder="Search friends..."
                      className="pr-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredFriends.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFriends.map((friend) => (
                      <motion.div 
                        key={friend.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {friend.profiles.display_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{friend.profiles.display_name}</h3>
                            <p className="text-sm text-muted-foreground">@{friend.profiles.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMessageFriend(friend.profiles.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/profile/${friend.profiles.username}`)}
                          >
                            View Profile
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No friends yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Find people from your school and connect with them
                    </p>
                    <Button onClick={() => navigate('/add-friends')}>Find Friends</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            }>
              <FriendRequestsTab 
                requests={pendingRequests}
                loading={loading}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
              />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="sent">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            }>
              <SentRequestsTab 
                requests={sentRequests}
                loading={loading} 
                onCancel={handleCancelRequest}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
        
        {/* AdSense Ad at the bottom of the page */}
        <div className="w-full overflow-hidden mt-4">
          <ins className="adsbygoogle w-full"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-3116464894083582"
               data-ad-slot="2813542194"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
          <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </div>
      </div>
    </AppLayout>
  );
};

export default Friends;
