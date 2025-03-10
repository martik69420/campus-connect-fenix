
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/post/PostCard';
import { useAuth } from '@/context/AuthContext';

type FriendStatus = 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      
      // Find mock user with matching username
      const mockUsers = [
        {
          id: "1",
          username: "john_doe",
          displayName: "John Doe",
          avatar: "/placeholder.svg",
          coins: 500,
          inviteCode: "test",
          createdAt: new Date(),
          school: "Example University",
          bio: "Computer Science student and tech enthusiast.",
          friends: ["2", "3"]
        },
        {
          id: "2",
          username: "jane_smith",
          displayName: "Jane Smith",
          avatar: "/placeholder.svg",
          coins: 750,
          inviteCode: "test",
          createdAt: new Date(),
          school: "Example University",
          bio: "Psychology major, love reading and coffee.",
          friends: ["1"]
        },
        {
          id: "3",
          username: "alex_johnson",
          displayName: "Alex Johnson",
          avatar: "/placeholder.svg",
          coins: 350,
          inviteCode: "test",
          createdAt: new Date(),
          school: "Example University",
          friends: ["1"]
        }
      ];
      
      const foundProfile = mockUsers.find(u => u.username === username);
      
      if (!foundProfile) {
        toast({
          title: "Profile not found",
          description: "This user doesn't exist",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      // Convert to format expected by components
      const profileData = {
        id: foundProfile.id,
        username: foundProfile.username,
        display_name: foundProfile.displayName,
        avatar_url: foundProfile.avatar,
        coins: foundProfile.coins,
        invite_code: foundProfile.inviteCode,
        created_at: foundProfile.createdAt.toISOString(),
        school: foundProfile.school,
        bio: foundProfile.bio,
      };
      
      setProfile(profileData);
      
      // Check if this user is a friend
      if (user.id !== foundProfile.id) {
        if (user.friends && user.friends.includes(foundProfile.id)) {
          setFriendStatus('friends');
        } else {
          setFriendStatus('not_friend');
        }
      }
      
      // Simulate posts
      const mockPosts = [
        {
          id: "post1",
          content: "Just attended an amazing workshop on AI!",
          created_at: new Date().toISOString(),
          user_id: foundProfile.id,
          is_professional: true,
          profiles: {
            username: foundProfile.username,
            display_name: foundProfile.displayName,
            avatar_url: foundProfile.avatar
          },
          likes: [],
          comments: []
        },
        {
          id: "post2",
          content: "Looking forward to the campus event this weekend!",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: foundProfile.id,
          is_professional: false,
          profiles: {
            username: foundProfile.username,
            display_name: foundProfile.displayName,
            avatar_url: foundProfile.avatar
          },
          likes: [],
          comments: []
        }
      ];
      
      setPosts(mockPosts);
      
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFriendAction = async () => {
    if (!user || !profile) return;
    
    try {
      setLoadingFriendAction(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (friendStatus === 'not_friend') {
        setFriendStatus('friends');
        toast({
          title: "Friend added",
          description: `You are now friends with ${profile.display_name}`
        });
      } else {
        setFriendStatus('not_friend');
        toast({
          title: "Friend removed",
          description: `You are no longer friends with ${profile.display_name}`
        });
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
  
  const isOwnProfile = user?.id === profile.id;
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <ProfileHeader 
          profileUser={profile}
          isOwnProfile={isOwnProfile}
          friendStatus={friendStatus}
          onFriendAction={handleFriendAction}
          loadingFriendAction={loadingFriendAction}
        />
        
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
                  post={post} 
                  onAction={() => {}} 
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
                  post={post} 
                  onAction={() => {}} 
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
