
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilLine, Heart, Bookmark, User } from 'lucide-react';
import ProfilePosts from './ProfilePosts';
import ProfileLikedPosts from './ProfileLikedPosts';
import ProfileSavedPosts from './ProfileSavedPosts';
import ProfileAbout from './ProfileAbout';

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ username, isOwnProfile }) => {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-8 p-1.5 gap-1 bg-muted/50 rounded-xl h-auto">
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
      </div>
    </Tabs>
  );
};

export default ProfileTabs;
