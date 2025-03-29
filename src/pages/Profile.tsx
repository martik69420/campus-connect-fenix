import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/post/PostCard';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

type FriendStatus = 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchPosts } = usePost();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('not_friend');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFriendAction, setLoadingFriendAction] = useState(false);
  
  useEffect(() => {
    if (!username) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchProfile();
  }, [navigate, username, user]);
  
  const fetchProfile = async () => {
    if (!username || !user) return;
    
    try {
      setLoading(true);
      
      // Try to fetch profile from Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        
        if (error.code === 'PGRST116') {
          toast({
            title: "Profile not found",
            description: `The user @${username} doesn't exist`,
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        throw error;
      }
      
      // Make sure profile data includes the required fields
      const processedProfile = {
        ...profileData,
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name || profileData.username,
        avatar: profileData.avatar_url,
        bio: profileData.bio,
        location: profileData.location,
        school: profileData.school,
        createdAt: profileData.created_at,
        email: profileData.email
      };
      
      setProfile(processedProfile);
      
      // Check if this user is a friend
      if (processedProfile && user.id !== processedProfile.id) {
        const { data: friendData } = await supabase
          .from('friends')
          .select('status, user_id')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${processedProfile.id}),and(user_id.eq.${processedProfile.id},friend_id.eq.${user.id})`)
          .maybeSingle();
          
        if (friendData) {
          if (friendData.status === 'friends') {
            setFriendStatus('friends');
          } else if (friendData.user_id === user.id) {
            setFriendStatus('pending_sent');
          } else {
            setFriendStatus('pending_received');
          }
        } else {
          setFriendStatus('not_friend');
        }
      }
      
      // Fetch posts for this profile
      if (processedProfile) {
        fetchProfilePosts(processedProfile.id);
      }
      
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfilePosts = async (userId: string) => {
    if (!userId) return;
    
    setLoadingPosts(true);
    
    try {
      // Try to fetch posts from Supabase
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          images,
          created_at,
          user_id,
          likes:likes(id, user_id),
          comments:comments(id, content, user_id, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
      
      if (postsData && postsData.length > 0) {
        // Process the posts data
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          userId: post.user_id,
          content: post.content,
          images: post.images,
          createdAt: safeParseDate(post.created_at).toISOString(), // Convert Date to string
          likes: (post.likes || []).map(like => like.user_id || like.id),
          comments: (post.comments || []).map(comment => ({
            id: comment.id,
            content: comment.content,
            userId: comment.user_id,
            createdAt: safeParseDate(comment.created_at).toISOString()
          })),
          shares: 0
        }));
        
        setPosts(formattedPosts);
      } else {
        setPosts([]);
      }
      
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };
  
  const handleFriendAction = async () => {
    if (!user || !profile) return;
    
    try {
      setLoadingFriendAction(true);
      
      // Different actions based on current friend status
      if (friendStatus === 'not_friend') {
        // Send friend request
        const { error } = await supabase
          .from('friends')
          .insert({
            user_id: user.id,
            friend_id: profile.id,
            status: 'pending'
          });
          
        if (error) throw error;
        setFriendStatus('pending_sent');
        
        toast({
          title: "Friend request sent",
          description: `Friend request sent to ${profile.display_name}`
        });
      } 
      else if (friendStatus === 'pending_received') {
        // Accept friend request
        const { error } = await supabase
          .from('friends')
          .update({ status: 'friends' })
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`);
          
        if (error) throw error;
        setFriendStatus('friends');
        
        toast({
          title: "Friend request accepted",
          description: `You are now friends with ${profile.display_name}`
        });
      }
      else if (friendStatus === 'friends' || friendStatus === 'pending_sent') {
        // Remove friend or cancel request
        const { error } = await supabase
          .from('friends')
          .delete()
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`);
          
        if (error) throw error;
        setFriendStatus('not_friend');
        
        toast({
          title: friendStatus === 'friends' ? "Friend removed" : "Request canceled",
          description: friendStatus === 'friends' 
            ? `You are no longer friends with ${profile.display_name}` 
            : `Friend request to ${profile.display_name} was canceled`
        });
      }
      
    } catch (error: any) {
      console.error("Friend action failed:", error);
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingFriendAction(false);
    }
  };
  
  const refreshPosts = () => {
    if (profile) {
      fetchProfilePosts(profile.id);
      // Also refresh global posts
      fetchPosts();
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-8">
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <div className="flex items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="ml-4 space-y-2 flex-1">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (!profile) return null;
  
  const isOwnProfile = user?.id === profile.id;
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <ProfileHeader 
          user={profile}
          isCurrentUser={isOwnProfile}
          isFriend={friendStatus === 'friends'}
          onAddFriend={handleFriendAction}
          onRemoveFriend={handleFriendAction}
          loading={loadingFriendAction}
        />
        
        <Tabs defaultValue="posts" className="w-full mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved">Saved</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="posts" className="space-y-6">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border shadow-sm p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  onAction={refreshPosts} 
                />
              ))
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-muted-foreground mt-1">
                  {isOwnProfile ? "You haven't posted anything yet." : `${profile.display_name} hasn't posted anything yet.`}
                </p>
              </div>
            )}
          </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-6">
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">Saved posts</h3>
                <p className="text-muted-foreground mt-1">This feature is coming soon!</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Profile;
