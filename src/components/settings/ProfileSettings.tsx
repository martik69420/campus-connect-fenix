
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

export const ProfileSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Store website as a separate field since it's not directly in UserSettings
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.settings?.privacy?.website || '', // Adjust this based on where website is actually stored
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveProfileData = async () => {
    if (!updateUserProfile) return;
    
    setIsSaving(true);
    
    try {
      const success = await updateUserProfile({
        displayName: profileData.displayName,
        bio: profileData.bio,
        location: profileData.location,
        // Store website in a field that actually exists in the UserSettings type
        // Let's store it in the user's settings object
        settings: {
          ...(user?.settings || {}),
          // Make sure we're not trying to add 'website' directly to settings
          // Instead, we'll add any website info to an existing property or 
          // handle it according to the UserSettings interface
          theme: user?.settings?.theme || 'default',
          // You can modify this part based on where you want to store the website data
          publicLikedPosts: user?.settings?.publicLikedPosts || false,
          publicSavedPosts: user?.settings?.publicSavedPosts || false,
          emailNotifications: user?.settings?.emailNotifications || false,
          pushNotifications: user?.settings?.pushNotifications || false,
          privacy: {
            ...(user?.settings?.privacy || {}),
            profileVisibility: user?.settings?.privacy?.profileVisibility || 'public',
            onlineStatus: user?.settings?.privacy?.onlineStatus || true,
            friendRequests: user?.settings?.privacy?.friendRequests || true,
            showActivity: user?.settings?.privacy?.showActivity || true,
            allowMessages: user?.settings?.privacy?.allowMessages || 'friends',
            allowTags: user?.settings?.privacy?.allowTags || true,
            dataSharing: user?.settings?.privacy?.dataSharing || true,
            showEmail: user?.settings?.privacy?.showEmail || false,
            website: profileData.website // Store website in the privacy section
          }
        }
      });
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile information.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <User className="h-5 w-5 mr-2 text-primary" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your profile details and how others see you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              name="displayName" 
              value={profileData.displayName} 
              onChange={handleInputChange} 
              placeholder="Your display name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              value={profileData.bio} 
              onChange={handleInputChange} 
              placeholder="Write a short bio about yourself"
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              name="location" 
              value={profileData.location} 
              onChange={handleInputChange} 
              placeholder="Where are you based?"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              name="website" 
              value={profileData.website} 
              onChange={handleInputChange} 
              placeholder="Your personal website or social media"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={saveProfileData} 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
