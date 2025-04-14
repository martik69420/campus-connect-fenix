
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePosts from '@/components/profile/ProfilePosts';
import ProfileFriends from '@/components/profile/ProfileFriends';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import { Shield, Star, Award, BookMarked, Heart } from 'lucide-react';
import ProfileBadges from '@/components/profile/ProfileBadges';
import { UserBadge } from '@/types/user';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Example badges for demonstration - in a real app, these would come from your database
  const userBadges: UserBadge[] = [
    {
      id: '1',
      name: 'Early Adopter',
      description: 'Joined during the platform's beta phase',
      icon: 'star',
      backgroundColor: '#FFD700',
      color: '#000000',
      earned: true
    },
    {
      id: '2',
      name: 'Conversation Starter',
      description: 'Started 10 conversations that received replies',
      icon: 'award',
      backgroundColor: '#9b87f5',
      color: '#FFFFFF',
      earned: true
    },
    {
      id: '3',
      name: 'Content Creator',
      description: 'Created 25 posts that received likes',
      icon: 'trophy',
      backgroundColor: '#7E69AB',
      color: '#FFFFFF',
      earned: false
    },
    {
      id: '4',
      name: 'Popular',
      description: 'Has more than 50 friends',
      icon: 'heart',
      backgroundColor: '#FF6B6B',
      color: '#FFFFFF',
      earned: true
    }
  ];

  useEffect(() => {
    if (user && username) {
      setIsCurrentUser(user.username === username);
      setIsLoading(false);
    }
  }, [user, username]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-6">
          <Card className="mb-4">
            <div className="flex items-center space-x-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
          <Card>
            <Tabs defaultValue="posts" className="w-full">
              <TabsList>
                <TabsTrigger value="posts"><Skeleton className="h-6 w-20" /></TabsTrigger>
                <TabsTrigger value="about"><Skeleton className="h-6 w-20" /></TabsTrigger>
                <TabsTrigger value="friends"><Skeleton className="h-6 w-20" /></TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <Skeleton className="h-64 w-full" />
              </TabsContent>
              <TabsContent value="about">
                <Skeleton className="h-48 w-full" />
              </TabsContent>
              <TabsContent value="friends">
                <Skeleton className="h-48 w-full" />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-4 md:py-6">
        {isEditingProfile ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Edit Profile Picture</h3>
              <ProfilePictureUpload />
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)} className="mt-4">
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">
            <Card className="overflow-hidden border-2 border-primary/10 profile-card">
              <div className="h-24 md:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"></div>
              <div className="px-4 pb-4 -mt-12 relative">
                <ProfileHeader 
                  user={user || { id: '', username: username || '', displayName: username || '' }}
                  isCurrentUser={isCurrentUser}
                  isFriend={false}
                  onAddFriend={() => {}}
                  onRemoveFriend={() => {}}
                  loading={false} 
                />
                
                <div className="mt-4">
                  <div className="flex items-center mb-3">
                    <Award className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="font-medium text-sm">Badges</h3>
                  </div>
                  <ProfileBadges badges={userBadges} />
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="border border-primary/10 overflow-hidden">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-5 md:w-auto md:inline-flex">
              <TabsTrigger value="posts" className="flex items-center">
                <Star className="h-4 w-4 mr-2 hidden sm:block" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center">
                <Heart className="h-4 w-4 mr-2 hidden sm:block" />
                Liked
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center">
                <BookMarked className="h-4 w-4 mr-2 hidden sm:block" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center">
                <Shield className="h-4 w-4 mr-2 hidden sm:block" />
                About
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center">
                <Shield className="h-4 w-4 mr-2 hidden sm:block" />
                Friends
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="focus:outline-none">
              <ProfilePosts username={username} />
            </TabsContent>
            <TabsContent value="liked" className="focus:outline-none">
              <div className="p-4 text-center text-muted-foreground">
                <Heart className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
                <p>Posts liked by {username}</p>
                {isCurrentUser && !user?.settings?.publicLikedPosts && (
                  <p className="text-xs mt-2">Your liked posts are private. You can change this in settings.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="saved" className="focus:outline-none">
              <div className="p-4 text-center text-muted-foreground">
                <BookMarked className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
                <p>Saved posts</p>
                {isCurrentUser && (
                  <p className="text-xs mt-2">Only you can see your saved posts.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="about" className="focus:outline-none">
              <ProfileAbout username={username} />
            </TabsContent>
            <TabsContent value="friends" className="focus:outline-none">
              <ProfileFriends username={username} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
