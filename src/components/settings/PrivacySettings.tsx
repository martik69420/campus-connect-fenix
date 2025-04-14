
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, Globe, Shield, UserPlus, ChevronRight, Heart, BookMarked } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';

export const PrivacySettings = () => {
  const { user } = useAuth();
  const [profileVisibility, setProfileVisibility] = useState({
    isPublic: true,
    showEmail: false,
    showSchool: true,
    showLocation: true,
    publicLikedPosts: false,
    publicSavedPosts: false,
    allowFriendRequests: true,
  });

  const handleToggleChange = (setting: keyof typeof profileVisibility) => {
    setProfileVisibility(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    toast({ 
      title: "Setting updated", 
      description: `Your ${setting} preference has been saved.` 
    });
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control your privacy and what others can see about you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Profile Visibility</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="profile-visibility" className="font-medium">Public Profile</Label>
                    <p className="text-xs text-muted-foreground">Allow anyone to view your full profile</p>
                  </div>
                </div>
                <Switch 
                  id="profile-visibility" 
                  checked={profileVisibility.isPublic}
                  onCheckedChange={() => handleToggleChange('isPublic')}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <EyeOff className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="email-visibility" className="font-medium">Show Email</Label>
                    <p className="text-xs text-muted-foreground">Make your email visible to others</p>
                  </div>
                </div>
                <Switch 
                  id="email-visibility" 
                  checked={profileVisibility.showEmail}
                  onCheckedChange={() => handleToggleChange('showEmail')}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="school-visibility" className="font-medium">Show School</Label>
                    <p className="text-xs text-muted-foreground">Display your school on your profile</p>
                  </div>
                </div>
                <Switch 
                  id="school-visibility" 
                  checked={profileVisibility.showSchool}
                  onCheckedChange={() => handleToggleChange('showSchool')}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Content Privacy</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="liked-posts-visibility" className="font-medium">Public Liked Posts</Label>
                    <p className="text-xs text-muted-foreground">Let others see posts you've liked</p>
                  </div>
                </div>
                <Switch 
                  id="liked-posts-visibility" 
                  checked={profileVisibility.publicLikedPosts}
                  onCheckedChange={() => handleToggleChange('publicLikedPosts')}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BookMarked className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="saved-posts-visibility" className="font-medium">Public Saved Posts</Label>
                    <p className="text-xs text-muted-foreground">Let others see posts you've saved</p>
                  </div>
                </div>
                <Switch 
                  id="saved-posts-visibility" 
                  checked={profileVisibility.publicSavedPosts}
                  onCheckedChange={() => handleToggleChange('publicSavedPosts')}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Friend Requests</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="friend-requests" className="font-medium">Allow Friend Requests</Label>
                    <p className="text-xs text-muted-foreground">Let others send you friend requests</p>
                  </div>
                </div>
                <Switch 
                  id="friend-requests" 
                  checked={profileVisibility.allowFriendRequests}
                  onCheckedChange={() => handleToggleChange('allowFriendRequests')}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="mentions-setting" className="font-medium">Who can mention you</Label>
                    <p className="text-xs text-muted-foreground">Control who can @mention you in posts</p>
                  </div>
                </div>
                <Select defaultValue="everyone">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end">
          <Button className="bg-primary">Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
};
