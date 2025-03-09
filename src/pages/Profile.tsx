import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Profile as ProfileType, Post } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/post/PostCard';
import { Edit, Loader2, UserPlus, UserCheck, UserMinus } from 'lucide-react';

type FriendStatus = 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('not_friend');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFriendAction, setLoadingFriendAction] = useState(false);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setCurrentUser(session.user);
      fetchProfile();
    };
    
    checkUser();
  }, [navigate, username]);
  
  const fetchProfile = async () => {
    if (!username) return;
    
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (profileError) throw profileError;
      
      setProfile(profile);
      
      // Fetch posts
      if (profile) {
        await fetchPosts(profile.id);
        
        // Check friend status if not viewing own profile
        if (currentUser && profile.id !== currentUser.id) {
          await checkFriendStatus(profile.id);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPosts = async (profileId: string) => {
    try {
      setLoadingPosts(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          images,
          is_professional,
          created_at,
          profiles (
            username,
            display_name,
            avatar_url
          ),
          likes: likes(id),
          comments: comments(id)
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Explicitly cast the data to the Post type
      const typedPosts = (data || []) as unknown as Post[];
      setPosts(typedPosts);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingPosts(false);
    }
  };
  
  const checkFriendStatus = async (profileId: string) => {
    if (!currentUser) return;
    
    try {
      // Check if there's a friend request from current user to profile
      const { data: sentRequest, error: sentError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('friend_id', profileId)
        .single();
      
      if (sentRequest) {
        setFriendStatus(sentRequest.status === 'accepted' ? 'friends' : 'pending_sent');
        return;
      }
      
      // Check if there's a friend request from profile to current user
      const { data: receivedRequest, error: receivedError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', profileId)
        .eq('friend_id', currentUser.id)
        .single();
      
      if (receivedRequest) {
        setFriendStatus(receivedRequest.status === 'accepted' ? 'friends' : 'pending_received');
        return;
      }
      
      setFriendStatus('not_friend');
    } catch (error) {
      // If no record found, they're not friends
      setFriendStatus('not_friend');
    }
  };
  
  const handleFriendAction = async () => {
    if (!currentUser || !profile) return;
    
    try {
      setLoadingFriendAction(true);
      
      switch (friendStatus) {
        case 'not_friend':
          // Send friend request
          await supabase
            .from('friends')
            .insert({
              user_id: currentUser.id,
              friend_id: profile.id,
              status: 'pending'
            });
          
          setFriendStatus('pending_sent');
          toast({
            title: "Friend request sent",
            description: `You sent a friend request to ${profile.display_name}`
          });
          break;
          
        case 'pending_received':
          // Accept friend request
          await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('user_id', profile.id)
            .eq('friend_id', currentUser.id);
          
          setFriendStatus('friends');
          toast({
            title: "Friend request accepted",
            description: `You are now friends with ${profile.display_name}`
          });
          break;
          
        case 'pending_sent':
        case 'friends':
          // Cancel request or unfriend
          await supabase
            .from('friends')
            .delete()
            .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);
          
          setFriendStatus('not_friend');
          toast({
            title: friendStatus === 'friends' ? "Unfriended" : "Request cancelled",
            description: friendStatus === 'friends' 
              ? `You are no longer friends with ${profile.display_name}` 
              : `Friend request to ${profile.display_name} cancelled`
          });
          break;
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingFriendAction(false);
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
  
  const isOwnProfile = currentUser?.id === profile.id;
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <ProfileHeader 
          profileUser={profile as any} 
          isOwnProfile={isOwnProfile}
        />
        
        {!isOwnProfile && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleFriendAction}
              disabled={loadingFriendAction}
              className="flex items-center gap-2"
              variant={friendStatus === 'friends' ? 'destructive' : friendStatus === 'pending_received' ? 'default' : 'outline'}
            >
              {loadingFriendAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : friendStatus === 'not_friend' ? (
                <UserPlus className="h-4 w-4" />
              ) : friendStatus === 'pending_sent' ? (
                <UserMinus className="h-4 w-4" />
              ) : friendStatus === 'pending_received' ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
              
              {friendStatus === 'not_friend' ? 'Add Friend' : 
                friendStatus === 'pending_sent' ? 'Cancel Request' : 
                friendStatus === 'pending_received' ? 'Accept Request' : 
                'Unfriend'}
            </Button>
          </div>
        )}
        
        <Tabs defaultValue="posts" className="w-full mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
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
                  post={post as any} 
                  onAction={() => fetchPosts(profile.id)} 
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
          
          <TabsContent value="professional" className="space-y-6">
            {loadingPosts ? (
              Array.from({ length: 2 }).map((_, i) => (
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
            ) : posts.filter(p => p.is_professional).length > 0 ? (
              posts.filter(p => p.is_professional).map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post as any} 
                  onAction={() => fetchPosts(profile.id)} 
                />
              ))
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No professional posts yet</h3>
                <p className="text-muted-foreground mt-1">
                  {isOwnProfile 
                    ? "Share your professional achievements and insights!" 
                    : `${profile.display_name} hasn't shared any professional posts yet.`}
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
