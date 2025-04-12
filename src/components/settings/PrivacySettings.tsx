
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSettingsType } from '@/types/user';

export function PrivacySettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  // Get initial values from user settings or use defaults
  const [settings, setSettings] = useState<UserSettingsType>({
    privacyProfile: user?.settings?.privacy?.profileVisibility || 'public',
    showEmail: user?.settings?.privacy?.showEmail || false,
    showSchool: user?.settings?.privacy?.onlineStatus || true,
    showLocation: user?.settings?.privacy?.dataSharing || true,
    showLikedPosts: user?.settings?.privacy?.showActivity || false,
    showSavedPosts: user?.settings?.privacy?.friendRequests || false,
    showActivity: user?.settings?.privacy?.showActivity || true,
    showFriendsList: user?.settings?.privacy?.dataSharing || true,
    readReceipts: user?.settings?.privacy?.showEmail || true,
  });

  const handleToggleChange = (setting: keyof UserSettingsType) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSelectChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      privacyProfile: value as 'public' | 'friends' | 'private'
    }));
  };

  const saveSettings = async () => {
    try {
      await updateUserProfile({
        settings: {
          privacy: {
            profileVisibility: settings.privacyProfile,
            showEmail: settings.showEmail,
            onlineStatus: settings.showSchool,
            dataSharing: settings.showLocation,
            showActivity: settings.showLikedPosts,
            friendRequests: settings.showSavedPosts,
            allowMessages: "all", // default value
            allowTags: true // default value
          }
        }
      });
      
      toast({
        title: "Settings Saved",
        description: "Your privacy settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Privacy Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-privacy">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Who can see your profile</p>
            </div>
            <Select 
              value={settings.privacyProfile} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          <h3 className="text-base font-medium">Profile Information</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-email">Show Email</Label>
            <Switch 
              id="show-email" 
              checked={settings.showEmail}
              onCheckedChange={() => handleToggleChange('showEmail')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-school">Show School</Label>
            <Switch 
              id="show-school" 
              checked={settings.showSchool}
              onCheckedChange={() => handleToggleChange('showSchool')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-location">Show Location</Label>
            <Switch 
              id="show-location" 
              checked={settings.showLocation}
              onCheckedChange={() => handleToggleChange('showLocation')}
            />
          </div>
          
          <Separator />
          <h3 className="text-base font-medium">Content Visibility</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-liked-posts">Show Liked Posts</Label>
              <p className="text-sm text-muted-foreground">Allow others to see posts you've liked</p>
            </div>
            <Switch 
              id="show-liked-posts" 
              checked={settings.showLikedPosts}
              onCheckedChange={() => handleToggleChange('showLikedPosts')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-saved-posts">Show Saved Posts</Label>
              <p className="text-sm text-muted-foreground">Allow others to see posts you've saved</p>
            </div>
            <Switch 
              id="show-saved-posts" 
              checked={settings.showSavedPosts}
              onCheckedChange={() => handleToggleChange('showSavedPosts')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-activity">Show Activity Status</Label>
            <Switch 
              id="show-activity" 
              checked={settings.showActivity}
              onCheckedChange={() => handleToggleChange('showActivity')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-friends">Show Friends List</Label>
            <Switch 
              id="show-friends" 
              checked={settings.showFriendsList}
              onCheckedChange={() => handleToggleChange('showFriendsList')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="read-receipts">Read Receipts</Label>
            <Switch 
              id="read-receipts" 
              checked={settings.readReceipts}
              onCheckedChange={() => handleToggleChange('readReceipts')}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={saveSettings}>Save Privacy Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}
