
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Bell, Eye, Calendar, User, Cog, Camera, UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { validateCurrentPassword, changePassword } from '@/context/auth/authUtils';

const Settings = () => {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    messages: true,
    friendRequests: true,
    mentions: true,
    commentReplies: true,
    postLikes: true,
    friendActivity: true,
    announcements: false,
    email: true
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profile: 'everyone',
    onlineStatus: true,
    activityStatus: true,
    readReceipts: true,
    searchable: true,
    dataSharing: false
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    accountActivity: true,
    securityAlerts: true
  });
  
  // State for saving changes
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  
  // Settings loading
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      // Set profile data
      setDisplayName(user.displayName);
      setEmail(user.email);
      setBio(user.bio || '');
      setUsername(user.username);
      setAvatarUrl(user.avatar);
      
      // Fetch user settings
      fetchUserSettings();
    }
  }, [user, isAuthenticated, isLoading, navigate]);
  
  const fetchUserSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Set location, pronouns, and birthday
        setLocation(data.location || '');
        setPronouns(data.pronouns || '');
        setBirthday(data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '');
        
        // Set notification settings
        setNotifSettings({
          messages: data.notif_messages ?? true,
          friendRequests: data.notif_friend_requests ?? true,
          mentions: data.notif_mentions ?? true,
          commentReplies: data.notif_comment_replies ?? true,
          postLikes: data.notif_post_likes ?? true,
          friendActivity: data.notif_friend_activity ?? true,
          announcements: data.notif_announcements ?? false,
          email: data.notif_email ?? true
        });
        
        // Set privacy settings
        setPrivacySettings({
          profile: data.privacy_profile || 'everyone',
          onlineStatus: data.privacy_online_status ?? true,
          activityStatus: data.privacy_activity_status ?? true,
          readReceipts: data.privacy_read_receipts ?? true,
          searchable: data.privacy_searchable ?? true,
          dataSharing: data.privacy_data_sharing ?? false
        });
        
        // Set security settings
        setSecuritySettings({
          twoFactorAuth: data.security_2fa ?? false,
          loginNotifications: data.security_login_notif ?? true,
          accountActivity: data.security_account_activity ?? true,
          securityAlerts: data.security_alerts ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user settings',
        variant: 'destructive'
      });
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    
    setUploadingAvatar(true);
    const file = e.target.files[0];
    
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setAvatarUrl(avatarUrl);
      
      // Update user context
      updateUser({ avatar: avatarUrl });
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile picture',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Update user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          location,
          pronouns,
          birthday: birthday ? new Date(birthday).toISOString() : null
        });
        
      if (settingsError) throw settingsError;
      
      // Update user context
      updateUser({
        displayName,
        bio
      });
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSavingProfile(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setSavingNotifications(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notif_messages: notifSettings.messages,
          notif_friend_requests: notifSettings.friendRequests,
          notif_mentions: notifSettings.mentions,
          notif_comment_replies: notifSettings.commentReplies,
          notif_post_likes: notifSettings.postLikes,
          notif_friend_activity: notifSettings.friendActivity,
          notif_announcements: notifSettings.announcements,
          notif_email: notifSettings.email
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive'
      });
    } finally {
      setSavingNotifications(false);
    }
  };
  
  const handleSavePrivacy = async () => {
    if (!user) return;
    
    setSavingPrivacy(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_profile: privacySettings.profile,
          privacy_online_status: privacySettings.onlineStatus,
          privacy_activity_status: privacySettings.activityStatus,
          privacy_read_receipts: privacySettings.readReceipts,
          privacy_searchable: privacySettings.searchable,
          privacy_data_sharing: privacySettings.dataSharing
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Privacy settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive'
      });
    } finally {
      setSavingPrivacy(false);
    }
  };
  
  const handleSaveSecurity = async () => {
    if (!user) return;
    
    setSavingSecurity(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          security_2fa: securitySettings.twoFactorAuth,
          security_login_notif: securitySettings.loginNotifications,
          security_account_activity: securitySettings.accountActivity,
          security_alerts: securitySettings.securityAlerts
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Security settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security settings',
        variant: 'destructive'
      });
    } finally {
      setSavingSecurity(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // Validate current password
      const isValid = await validateCurrentPassword(user.id, currentPassword);
      
      if (!isValid) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive'
        });
        setChangingPassword(false);
        return;
      }
      
      // Change password
      const success = await changePassword(user.id, newPassword);
      
      if (!success) {
        throw new Error('Failed to update password');
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive'
      });
    } finally {
      setChangingPassword(false);
    }
  };
  
  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
              {displayName?.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <label 
            htmlFor="avatar-upload" 
            className="absolute -right-2 -bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full cursor-pointer shadow-md"
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Upload new avatar</span>
          </label>
          
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
        </div>
        
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold">{displayName || 'Your Name'}</h2>
          <p className="text-muted-foreground">@{username}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {/* use correct icon import (User) and not Users */}
            <UserIcon className="inline h-3 w-3 mr-1" /> {user?.school || 'School'}
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            disabled
            placeholder="username"
          />
          <p className="text-xs text-muted-foreground">
            Username cannot be changed.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            placeholder="email@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Contact support to change your email.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Select
            value={pronouns}
            onValueChange={setPronouns}
          >
            <SelectTrigger id="pronouns">
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Prefer not to say</SelectItem>
              <SelectItem value="he/him">He/Him</SelectItem>
              <SelectItem value="she/her">She/Her</SelectItem>
              <SelectItem value="they/them">They/Them</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            {bio?.length || 0}/150 characters
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveProfile} 
          disabled={savingProfile}
        >
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
  
  const renderAccountSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Change Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure additional security features for your account
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) => 
                setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="loginNotifications">Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when your account is logged into
              </p>
            </div>
            <Switch
              id="loginNotifications"
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) => 
                setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accountActivity">Account Activity History</Label>
              <p className="text-sm text-muted-foreground">
                Track and review your account activity
              </p>
            </div>
            <Switch
              id="accountActivity"
              checked={securitySettings.accountActivity}
              onCheckedChange={(checked) => 
                setSecuritySettings(prev => ({ ...prev, accountActivity: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="securityAlerts">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts about suspicious activity
              </p>
            </div>
            <Switch
              id="securityAlerts"
              checked={securitySettings.securityAlerts}
              onCheckedChange={(checked) => 
                setSecuritySettings(prev => ({ ...prev, securityAlerts: checked }))
              }
            />
          </div>
          
          <Button 
            onClick={handleSaveSecurity} 
            disabled={savingSecurity}
          >
            {savingSecurity ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
  
  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose what notifications you want to receive
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="messages">Messages</Label>
              <p className="text-sm text-muted-foreground">
                Notifications for new messages
              </p>
            </div>
            <Switch
              id="messages"
              checked={notifSettings.messages}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, messages: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="friendRequests">Friend Requests</Label>
              <p className="text-sm text-muted-foreground">
                Notifications for new friend requests
              </p>
            </div>
            <Switch
              id="friendRequests"
              checked={notifSettings.friendRequests}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, friendRequests: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mentions">Mentions</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when you're mentioned in posts or comments
              </p>
            </div>
            <Switch
              id="mentions"
              checked={notifSettings.mentions}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, mentions: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="commentReplies">Comment Replies</Label>
              <p className="text-sm text-muted-foreground">
                Notifications for replies to your comments
              </p>
            </div>
            <Switch
              id="commentReplies"
              checked={notifSettings.commentReplies}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, commentReplies: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="postLikes">Post Likes</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when someone likes your posts
              </p>
            </div>
            <Switch
              id="postLikes"
              checked={notifSettings.postLikes}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, postLikes: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="friendActivity">Friend Activity</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about your friends' activity
              </p>
            </div>
            <Switch
              id="friendActivity"
              checked={notifSettings.friendActivity}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, friendActivity: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="announcements">Announcements</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about platform updates and announcements
              </p>
            </div>
            <Switch
              id="announcements"
              checked={notifSettings.announcements}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, announcements: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifs">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifs"
              checked={notifSettings.email}
              onCheckedChange={(checked) => 
                setNotifSettings(prev => ({ ...prev, email: checked }))
              }
            />
          </div>
          
          <Button 
            onClick={handleSaveNotifications} 
            disabled={savingNotifications}
          >
            {savingNotifications ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
  
  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control who can see your profile and activity
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select
              value={privacySettings.profile}
              onValueChange={(value) => 
                setPrivacySettings(prev => ({ ...prev, profile: value }))
              }
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue placeholder="Who can see your profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="nobody">Nobody</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="onlineStatus">Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see when you're online
              </p>
            </div>
            <Switch
              id="onlineStatus"
              checked={privacySettings.onlineStatus}
              onCheckedChange={(checked) => 
                setPrivacySettings(prev => ({ ...prev, onlineStatus: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="activityStatus">Activity Status</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your recent activity
              </p>
            </div>
            <Switch
              id="activityStatus"
              checked={privacySettings.activityStatus}
              onCheckedChange={(checked) => 
                setPrivacySettings(prev => ({ ...prev, activityStatus: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="readReceipts">Read Receipts</Label>
              <p className="text-sm text-muted-foreground">
                Show others when you've read their messages
              </p>
            </div>
            <Switch
              id="readReceipts"
              checked={privacySettings.readReceipts}
              onCheckedChange={(checked) => 
                setPrivacySettings(prev => ({ ...prev, readReceipts: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="searchable">Searchable</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you via search
              </p>
            </div>
            <Switch
              id="searchable"
              checked={privacySettings.searchable}
              onCheckedChange={(checked) => 
                setPrivacySettings(prev => ({ ...prev, searchable: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dataSharing">Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Share anonymous usage data to help improve the platform
              </p>
            </div>
            <Switch
              id="dataSharing"
              checked={privacySettings.dataSharing}
              onCheckedChange={(checked) => 
                setPrivacySettings(prev => ({ ...prev, dataSharing: checked }))
              }
            />
          </div>
          
          <Button 
            onClick={handleSavePrivacy} 
            disabled={savingPrivacy}
          >
            {savingPrivacy ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
  
  if (isLoading || settingsLoading) {
    return (
      <AppLayout>
        <div className="container max-w-5xl py-6 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
          </div>
          
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>
            
            <Card className="mt-4">
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>
        
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderProfileSettings()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderAccountSecurity()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Control what notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderNotificationSettings()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Manage your privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPrivacySettings()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
