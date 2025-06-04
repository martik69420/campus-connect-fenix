
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilLine, Heart, Bookmark, User, Award, TrendingUp } from 'lucide-react';
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
      <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-8 p-1.5 gap-1 bg-muted/50 rounded-xl h-auto">
        <TabsTrigger 
          value="posts" 
          className="flex gap-2 items-center py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
        >
          <PencilLine className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Posts</span>
        </TabsTrigger>
        <TabsTrigger 
          value="liked" 
          className="flex gap-2 items-center py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
        >
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Liked</span>
        </TabsTrigger>
        <TabsTrigger 
          value="saved" 
          className="flex gap-2 items-center py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
        >
          <Bookmark className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Saved</span>
        </TabsTrigger>
        <TabsTrigger 
          value="about" 
          className="flex gap-2 items-center py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">About</span>
        </TabsTrigger>
        <TabsTrigger 
          value="badges" 
          className="flex gap-2 items-center py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
        >
          <Award className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Badges</span>
          {earnedBadges.length > 0 && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold shadow-sm">
              {earnedBadges.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <div className="bg-background/50 rounded-xl p-6 border border-border/50">
        <TabsContent value="posts" className="mt-0">
          <ProfilePosts username={username} />
        </TabsContent>
        
        <TabsContent value="liked" className="mt-0">
          <ProfileLikedPosts username={username} />
        </TabsContent>
        
        <TabsContent value="saved" className="mt-0">
          <ProfileSavedPosts username={username} />
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <ProfileAbout username={username} isEditable={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="badges" className="mt-0">
          <ProfileBadges badges={badges} className="pt-0" />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProfileTabs;
