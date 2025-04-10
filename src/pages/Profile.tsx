
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Mail, MapPin, Globe, Briefcase, Users, Heart, BookmarkIcon, GamepadIcon, HashIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileUpdateForm from '@/components/profile/ProfileUpdateForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdBanner from '@/components/ads/AdBanner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [profileStatsLoading, setProfileStatsLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    if (username) {
      fetchProfile(username);
      if (user) {
        checkFriendStatus(username);
        if (user.username === username) {
          fetchUserStats();
          fetchFriends();
        }
      }
    }
  }, [username, isAuthenticated, isLoading, navigate, user]);
  
  const fetchProfile = async (username: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile.",
          variant: "destructive"
        });
      }
      
      if (data) {
        setProfile(data);
      } else {
        // If no profile found, redirect to a 404 page
        navigate('/not-found');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserStats = async () => {
    setProfileStatsLoading(true);
    try {
      // Fetch saved posts count
      const { data: savedData } = await supabase
        .from('saved_posts')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id);
      
      setSavedPosts(savedData || []);
      
      // Fetch liked posts count
      const { data: likedData } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id);
      
      setLikedPosts(likedData || []);
      
      // Fetch friends count
      const { count: friendsCountData } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'friends')
        .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);
      
      setFriendsCount(friendsCountData || 0);
      
      // Fetch games played count - fixed the table name from 'game_sessions' to 'game_history'
      const { count: gamesPlayedData } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      setGamesPlayed(gamesPlayedData || 0);
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setProfileStatsLoading(false);
    }
  };
  
  const fetchFriends = async () => {
    if (!user?.id) return;
    
    setLoadingFriends(true);
    try {
      // Get friends where user is the requester - Fixed the relationship hint
      const { data: userFriends } = await supabase
        .from('friends')
        .select(`
          id, 
          friend_id,
          profiles!friends_friend_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'friends');
      
      // Get friends where user is the recipient - Fixed the relationship hint
      const { data: friendsOfUser } = await supabase
        .from('friends')
        .select(`
          id, 
          user_id,
          profiles!friends_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'friends');
      
      const combinedFriends = [
        ...(userFriends || []).map(f => ({ 
          id: f.id, 
          friendId: f.friend_id, 
          username: f.profiles.username,
          displayName: f.profiles.display_name,
          avatar: f.profiles.avatar_url 
        })),
        ...(friendsOfUser || []).map(f => ({ 
          id: f.id, 
          friendId: f.user_id,
          username: f.profiles.username,
          displayName: f.profiles.display_name,
          avatar: f.profiles.avatar_url 
        }))
      ];
      
      setFriends(combinedFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };
  
  const checkFriendStatus = async (username: string) => {
    try {
      // First check if the profile belongs to the current user
      if (user?.username === username) {
        setFriendStatus('none');
        return;
      }
      
      // Get the user ID for the username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (!profileData) return;
      
      // Check if they are already friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('status')
        .or(`and(user_id.eq.${user?.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user?.id})`)
        .eq('status', 'friends');
        
      if (friendsData && friendsData.length > 0) {
        setFriendStatus('friends');
        return;
      }
      
      // Check if there's a pending request
      const { data: pendingData } = await supabase
        .from('friends')
        .select('status')
        .or(`and(user_id.eq.${user?.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user?.id})`)
        .eq('status', 'pending');
        
      if (pendingData && pendingData.length > 0) {
        setFriendStatus('pending');
        return;
      }
      
      setFriendStatus('none');
    } catch (error) {
      console.error("Error checking friend status:", error);
    }
  };
  
  const handleAddFriend = async () => {
    if (!profile || !user) return;
    
    setFriendActionLoading(true);
    try {
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: profile.id, status: 'pending' }
        ]);
        
      if (error) throw error;
      
      setFriendStatus('pending');
      toast({
        title: "Friend request sent",
        description: `Friend request sent to ${profile.display_name || profile.username}`,
      });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
    } finally {
      setFriendActionLoading(false);
    }
  };
  
  const handleRemoveFriend = async () => {
    if (!profile || !user) return;
    
    setFriendActionLoading(true);
    try {
      // Delete friend relationship in both directions
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`);
        
      setFriendStatus('none');
      toast({
        title: "Friend removed",
        description: `${profile.display_name || profile.username} has been removed from your friends`,
      });
    } catch (error: any) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive"
      });
    } finally {
      setFriendActionLoading(false);
    }
  };
  
  const handleMessage = () => {
    if (profile) {
      navigate(`/messages?userId=${profile.id}`);
    }
  };

  const isOwnProfile = user?.username === profile?.username;
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-lg font-medium">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Ad Banner at the top */}
        <AdBanner adSlot="5082313008" />
        
        {/* Profile Header with Avatar, Name, and Primary Actions */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProfileHeader 
              user={profile}
              isCurrentUser={isOwnProfile}
              isFriend={friendStatus === 'friends'}
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
              loading={friendActionLoading}
            />
          </motion.div>
        )}
        
        {/* Profile Stats - Only show on own profile */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-200">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{likedPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Liked</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-200">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <BookmarkIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{savedPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Saved</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-200">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{friendsCount}</p>
                <p className="text-sm text-muted-foreground">Friends</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-200">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <GamepadIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{gamesPlayed}</p>
                <p className="text-sm text-muted-foreground">Games Played</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Profile Tabs */}
        <Tabs defaultValue="about" className="mt-8">
          <TabsList className="grid grid-cols-4 md:w-[500px]">
            <TabsTrigger value="about">
              <Users className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="posts">
              <HashIcon className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes">
              <Heart className="mr-2 h-4 w-4" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="mr-2 h-4 w-4" />
              Friends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6 mt-6">
            {isEditing ? (
              <ProfileUpdateForm />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* About section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-300">
                    <CardHeader className="bg-secondary/5 pb-2">
                      <CardTitle className="flex items-center text-xl">
                        <Users className="mr-2 h-5 w-5" />
                        About
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <Separator />
                      
                      <div className="space-y-3">
                        {profile?.bio ? (
                          <p className="text-muted-foreground">{profile.bio}</p>
                        ) : (
                          <p className="text-muted-foreground italic">No bio provided</p>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                          {profile?.school && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                              <Briefcase className="h-4 w-4 text-primary" />
                              <span>{profile.school}</span>
                            </div>
                          )}
                          
                          {profile?.location && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{profile.location}</span>
                            </div>
                          )}
                          
                          {profile?.website && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                              <Globe className="h-4 w-4 text-primary" />
                              <a 
                                href={profile.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {profile.website}
                              </a>
                            </div>
                          )}
                          
                          {profile?.birthday && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              <span>{new Date(profile.birthday).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                            <Mail className="h-4 w-4 text-primary" />
                            <span>{profile?.email}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Interests section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-300">
                    <CardHeader className="bg-secondary/5 pb-2">
                      <CardTitle className="text-xl">Interests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <Separator />
                      
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests ? (
                          (Array.isArray(profile.interests) ? profile.interests : []).map((interest: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1.5 hover:bg-secondary/80 transition-colors">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground italic">No interests listed</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="mt-6">
            <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-secondary/5 pb-2">
                <CardTitle className="text-xl">Posts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No posts to show yet.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="likes" className="mt-6">
            <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-secondary/5 pb-2">
                <CardTitle className="text-xl">Liked Posts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isOwnProfile && likedPosts.length === 0 ? (
                  <p className="text-muted-foreground">You haven't liked any posts yet.</p>
                ) : !isOwnProfile ? (
                  <p className="text-muted-foreground">This section is only visible to the profile owner.</p>
                ) : (
                  <p className="text-muted-foreground">Loading liked posts...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-6">
            <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-secondary/5 pb-2">
                <CardTitle className="text-xl">Friends</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingFriends ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {friends.map((friend) => (
                      <div 
                        key={friend.id} 
                        className="flex flex-col items-center text-center p-2 hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate(`/profile/${friend.username}`)}
                      >
                        <Avatar className="w-16 h-16 mb-2">
                          <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {friend.displayName?.charAt(0) || friend.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium line-clamp-1">{friend.displayName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">@{friend.username}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No friends to display.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Ad Banner at the bottom */}
        <AdBanner adSlot="2813542194" />
      </div>
    </AppLayout>
  );
};

export default Profile;
