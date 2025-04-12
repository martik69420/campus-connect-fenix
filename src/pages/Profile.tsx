
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

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
      <div className="container py-6">
        {isEditingProfile ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Edit Profile Picture</h3>
              <ProfilePictureUpload />
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ProfileHeader 
            user={user || { id: '', username: username || '', displayName: username || '' }}
            isCurrentUser={isCurrentUser}
            isFriend={false}
            onAddFriend={() => {}}
            onRemoveFriend={() => {}}
            loading={false} 
          />
        )}

        <Card>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="focus:outline-none">
              <ProfilePosts username={username} />
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
