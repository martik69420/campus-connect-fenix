
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilLine, Heart, Bookmark, User, Award } from 'lucide-react';
import ProfilePosts from './ProfilePosts';
import ProfileLikedPosts from './ProfileLikedPosts';
import ProfileSavedPosts from './ProfileSavedPosts';
import ProfileAbout from './ProfileAbout';
import ProfileBadges from './ProfileBadges';
import { useAchievements } from '@/context/AchievementContext';

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ username, isOwnProfile }) => {
  const { badges } = useAchievements();
  
  const earnedBadges = badges.filter(badge => badge.earned);
  
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-4">
        <TabsTrigger value="posts" className="flex gap-1 items-center">
          <PencilLine className="h-4 w-4" />
          <span className="hidden sm:inline">Posts</span>
        </TabsTrigger>
        <TabsTrigger value="liked" className="flex gap-1 items-center">
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">Liked</span>
        </TabsTrigger>
        <TabsTrigger value="saved" className="flex gap-1 items-center">
          <Bookmark className="h-4 w-4" />
          <span className="hidden sm:inline">Saved</span>
        </TabsTrigger>
        <TabsTrigger value="about" className="flex gap-1 items-center">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">About</span>
        </TabsTrigger>
        <TabsTrigger value="badges" className="flex gap-1 items-center">
          <Award className="h-4 w-4" />
          <span className="hidden sm:inline">Badges</span>
          {earnedBadges.length > 0 && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
              {earnedBadges.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        <ProfilePosts username={username} />
      </TabsContent>
      
      <TabsContent value="liked">
        <ProfileLikedPosts username={username} />
      </TabsContent>
      
      <TabsContent value="saved">
        <ProfileSavedPosts username={username} />
      </TabsContent>
      
      <TabsContent value="about">
        <ProfileAbout username={username} isEditable={isOwnProfile} />
      </TabsContent>
      
      <TabsContent value="badges">
        <ProfileBadges badges={badges} className="pt-4" />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
