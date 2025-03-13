
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { User, UserPlus, UserCheck, UserX, Search, Users, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchFriends();
    }
  }, [user, isAuthenticated, isLoading, navigate]);
  
  const fetchFriends = async () => {
    if (!user) {
      console.log("Cannot fetch friends: User is not authenticated");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Fetching friends for user ID:", user.id);
      
      // Check if the user exists in the profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error("Error checking user profile:", profileError);
        // If the user doesn't exist in profiles, we can't fetch friends
        if (profileError.code === 'PGRST116') {
          toast({
            title: "User profile not found",
            description: "Your profile may not be properly set up. Try logging out and back in.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      // Fetch friends (status = 'friends') - FIXED: changed from 'accepted' to 'friends'
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          created_at,
          friend_id,
          profiles:friend_id (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'friends');
        
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        throw friendsError;
      }
      
      // Fetch received pending requests (where the current user is the friend_id)
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          created_at,
          user_id,
          profiles:user_id (*)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');
        
      if (receivedError) {
        console.error("Error fetching received requests:", receivedError);
        throw receivedError;
      }
      
      // Fetch sent pending requests
      const { data: sentData, error: sentError } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          created_at,
          friend_id,
          profiles:friend_id (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (sentError) {
        console.error("Error fetching sent requests:", sentError);
        throw sentError;
      }
      
      console.log("Friends data:", friendsData);
      console.log("Received requests:", receivedRequests);
      console.log("Sent requests:", sentData);
      
      setFriends(friendsData || []);
      setPendingRequests(receivedRequests || []);
      setSentRequests(sentData || []);
      
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
  
  const handleAcceptRequest = async (requestId: string, profileId: string) => {
    try {
      // Update the request status to 'friends' - FIXED: changed from 'friends' to 'friends'
      const { error } = await supabase
        .from('friends')
        .update({ status: 'friends' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({
        title: "Friend request accepted",
        description: "You are now friends!"
      });
      
      // Refresh the friends list
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
      
      toast({
        title: "Friend request declined",
      });
      
      // Refresh the friends list
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
      
      toast({
        title: "Friend removed",
      });
      
      // Refresh the friends list
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
      
      toast({
        title: "Friend request cancelled",
      });
      
      // Refresh the friends list
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
      <div className="max-w-4xl mx-auto p-4">
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
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <motion.div 
                        key={friend.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {friend.profiles.display_name.substring(0, 2).toUpperCase()}
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
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <motion.div 
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {request.profiles.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{request.profiles.display_name}</h3>
                            <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, request.profiles.id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pending requests</h3>
                    <p className="text-muted-foreground mt-1">
                      You don't have any pending friend requests
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : sentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <motion.div 
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {request.profiles.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{request.profiles.display_name}</h3>
                            <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel Request
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No sent requests</h3>
                    <p className="text-muted-foreground mt-1">
                      You haven't sent any friend requests yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Friends;
