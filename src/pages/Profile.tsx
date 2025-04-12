import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  Mail, 
  MapPin, 
  Globe, 
  Briefcase, 
  Users, 
  Heart, 
  BookmarkIcon, 
  GamepadIcon, 
  HashIcon,
  Link as LinkIcon,
  BadgeCheck,
  PencilLine,
  MessageSquare
} from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const isOwnProfile = user?.username === profile?.username;
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
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
      {/* Profile Banner */}
      <div className="relative w-full h-48 sm:h-64 -mt-4 overflow-hidden mb-16 sm:mb-24">
        <div className="absolute inset-0 profile-header"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <Avatar className="w-24 h-24 sm:w-36 sm:h-36 profile-avatar-border">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.display_name} />
            <AvatarFallback className="text-2xl bg-primary/20 dark:bg-primary/30 text-primary-foreground">
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {isOwnProfile && (
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
            onClick={handleEditProfile}
          >
            <PencilLine className="h-4 w-4 mr-1" />
            Edit Profile
          </Button>
        )}
      </div>
      
      <div className="container max-w-5xl mx-auto px-4 py-2 space-y-6">
        {/* Profile Info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{profile?.display_name}</h1>
            {profile?.school === "Campus Connect Admin" && (
              <BadgeCheck className="h-5 w-5 text-primary" />
            )}
          </div>
          <p className="text-muted-foreground">@{profile?.username}</p>
          
          {/* Friend/Message actions */}
          {!isOwnProfile && (
            <div className="flex justify-center mt-4 space-x-3">
              {friendStatus === 'friends' ? (
                <Button 
                  variant="outline" 
                  className="px-4"
                  disabled={friendActionLoading}
                  onClick={handleRemoveFriend}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Friends
                </Button>
              ) : friendStatus === 'pending' ? (
                <Button 
                  variant="outline" 
                  className="px-4"
                  disabled={true}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Pending
                </Button>
              ) : (
                <Button 
                  className="px-4"
                  disabled={friendActionLoading}
                  onClick={handleAddFriend}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="px-4"
                onClick={handleMessage}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          )}
          
          {/* Bio */}
          {profile?.bio && (
            <div className="max-w-2xl mx-auto mt-4 text-center">
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}
          
          {/* User Details */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {profile?.school && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{profile.school}</span>
              </Badge>
            )}
            
            {profile?.location && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.location}</span>
              </Badge>
            )}
            
            {profile?.website && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:underline text-primary"
                >
                  {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </Badge>
            )}
            
            {profile?.email && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile.email}</span>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Ad Banner */}
        <AdBanner adSlot="5082313008" />

        {/* Profile Stats - Only show on own profile */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="stats-card overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{likedPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Liked</p>
              </CardContent>
            </Card>
            
            <Card className="stats-card overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <BookmarkIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{savedPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Saved</p>
              </CardContent>
            </Card>
            
            <Card className="stats-card overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{friendsCount}</p>
                <p className="text-sm text-muted-foreground">Friends</p>
              </CardContent>
            </Card>
            
            <Card className="stats-card overflow-hidden">
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
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} md:w-[500px]`}>
            <TabsTrigger value="about">
              <Users className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="posts">
              <HashIcon className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="likes">
                <Heart className="mr-2 h-4 w-4" />
                Likes
              </TabsTrigger>
            )}
            <TabsTrigger value="friends">
              <Users className="mr-2 h-4 w-4" />
              Friends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6 mt-6">
            {isEditing ? (
              <ProfileUpdateForm onComplete={() => setIsEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* About section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="profile-card overflow-hidden">
                    <CardHeader className="bg-secondary/5 pb-2">
                      <CardTitle className="flex items-center text-xl">
                        <Users className="mr-2 h-5 w-5" />
                        About
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-muted-foreground">
                        {profile?.bio || "No bio provided"}
                      </p>
                      
                      {(profile?.school || profile?.location || profile?.website || profile?.email) && (
                        <>
                          <Separator className="my-4" />
                          <div className="grid grid-cols-1 gap-4">
                            {profile?.school && (
                              <div className="flex items-center gap-3 glass-panel p-3 rounded-md">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <span>{profile.school}</span>
                              </div>
                            )}
                            
                            {profile?.location && (
                              <div className="flex items-center gap-3 glass-panel p-3 rounded-md">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>{profile.location}</span>
                              </div>
                            )}
                            
                            {profile?.website && (
                              <div className="flex items-center gap-3 glass-panel p-3 rounded-md">
                                <Globe className="h-5 w-5 text-primary" />
                                <a 
                                  href={profile.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate"
                                >
                                  {profile.website}
                                </a>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 glass-panel p-3 rounded-md">
                              <Mail className="h-5 w-5 text-primary" />
                              <span className="truncate">{profile?.email}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Interests section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="profile-card overflow-hidden h-full">
                    <CardHeader className="bg-secondary/5 pb-2">
                      <CardTitle className="text-xl">Interests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests ? (
                          (Array.isArray(profile.interests) ? profile.interests : []).map((interest: string, index: number) => (
                            <Badge key={index} className="px-3 py-1.5 hover:bg-primary/10 transition-colors">
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
            <Card className="profile-card overflow-hidden">
              <CardHeader className="bg-secondary/5 pb-2">
                <CardTitle className="text-xl">Posts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <HashIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No posts to show yet.</p>
                  {isOwnProfile && (
                    <Button className="mt-4" onClick={() => navigate('/')}>
                      Create your first post
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="likes" className="mt-6">
            <Card className="profile-card overflow-hidden">
              <CardHeader className="bg-secondary/5 pb-2">
                <CardTitle className="text-xl">Liked Posts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  {isOwnProfile && likedPosts.length === 0 ? (
                    <p className="text-muted-foreground">You haven't liked any posts yet.</p>
                  ) : !isOwnProfile ? (
                    <p className="text-muted-foreground">This section is only visible to the profile owner.</p>
                  ) : (
                    <p className="text-muted-foreground">Loading liked posts...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-6">
            <Card className="profile-card overflow-hidden">
              <CardHeader className="bg-secondary/5 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Friends</CardTitle>
                  <Badge variant="outline">{friendsCount} total</Badge>
                </div>
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No friends to display</p>
                    {isOwnProfile && (
                      <Button variant="outline" onClick={() => navigate('/friends')}>
                        Find Friends
                      </Button>
                    )}
                  </div>
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
