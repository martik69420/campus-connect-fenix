
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Mail, MapPin, Globe, Briefcase, Users } from 'lucide-react';
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

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    if (username) {
      fetchProfile(username);
      if (user) {
        checkFriendStatus(username);
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
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
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
        
        {/* Profile Tabs */}
        <Tabs defaultValue="about" className="mt-8">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="about">
              <Users className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="posts">
              <Mail className="mr-2 h-4 w-4" />
              Posts
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
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-semibold flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        About
                      </h3>
                      <Separator />
                      
                      <div className="space-y-3">
                        {profile?.bio ? (
                          <p className="text-muted-foreground">{profile.bio}</p>
                        ) : (
                          <p className="text-muted-foreground italic">No bio provided</p>
                        )}
                        
                        {profile?.school && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.school}</span>
                          </div>
                        )}
                        
                        {profile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        
                        {profile?.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
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
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(profile.birthday).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.email}</span>
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
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-semibold">Interests</h3>
                      <Separator />
                      
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests ? (
                          (Array.isArray(profile.interests) ? profile.interests : []).map((interest: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1.5">
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
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Posts</h3>
                <p className="text-muted-foreground">No posts to show yet.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Friends</h3>
                <p className="text-muted-foreground">Coming soon!</p>
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
