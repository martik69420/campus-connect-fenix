
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { User, Lock, Bell, Shield, LogOut, Upload, Trash2, CheckCircle, XCircle, Globe, Eye, EyeOff, Calendar } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, updateUser, logout, updatePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    school: user?.school || '',
    username: user?.username || '',
    pronouns: '',
    birthday: '',
    location: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    accountActivity: true,
    securityAlerts: true
  });
  
  const [notifications, setNotifications] = useState({
    newMessages: true,
    friendRequests: true,
    mentions: true,
    announcements: false,
    commentReplies: true,
    postLikes: true,
    friendActivity: true,
    emailNotifications: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'everyone', // 'everyone', 'friends', 'private'
    onlineStatus: true,
    activityStatus: true,
    readReceipts: true,
    searchable: true,
    dataSharing: false
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  
  useEffect(() => {
    // Fetch additional user profile data
    const fetchExtendedProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          // Update state with fetched data
          setProfileData(prev => ({
            ...prev,
            pronouns: data.pronouns || '',
            birthday: data.birthday || '',
            location: data.location || ''
          }));
          
          setNotifications(prev => ({
            ...prev,
            newMessages: data.notif_messages ?? true,
            friendRequests: data.notif_friend_requests ?? true,
            mentions: data.notif_mentions ?? true,
            announcements: data.notif_announcements ?? false,
            commentReplies: data.notif_comment_replies ?? true,
            postLikes: data.notif_post_likes ?? true,
            friendActivity: data.notif_friend_activity ?? true,
            emailNotifications: data.notif_email ?? true
          }));
          
          setPrivacySettings(prev => ({
            ...prev,
            profileVisibility: data.privacy_profile || 'everyone',
            onlineStatus: data.privacy_online_status ?? true,
            activityStatus: data.privacy_activity_status ?? true,
            readReceipts: data.privacy_read_receipts ?? true,
            searchable: data.privacy_searchable ?? true,
            dataSharing: data.privacy_data_sharing ?? false
          }));
          
          setSecuritySettings(prev => ({
            ...prev,
            twoFactorEnabled: data.security_2fa ?? false,
            loginNotifications: data.security_login_notif ?? true,
            accountActivity: data.security_account_activity ?? true,
            securityAlerts: data.security_alerts ?? true
          }));
        }
      } catch (error: any) {
        console.error('Error fetching extended profile:', error);
      }
    };
    
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        school: user.school || '',
        username: user.username || '',
        pronouns: '',
        birthday: '',
        location: ''
      });
      
      fetchExtendedProfile();
    }
  }, [user]);
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate('/auth');
    return null;
  }
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // First update the main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.displayName,
          bio: profileData.bio,
          school: profileData.school
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Then update or insert extended profile settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          pronouns: profileData.pronouns,
          birthday: profileData.birthday,
          location: profileData.location
        }, { onConflict: 'user_id' });
        
      if (settingsError) throw settingsError;
      
      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicURL } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        // Update profile with new avatar URL
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicURL.publicUrl })
          .eq('id', user.id);
          
        if (avatarError) throw avatarError;
        
        // Update local user state
        updateUser({
          ...user,
          avatar: publicURL.publicUrl
        });
      }
      
      // Update local user state
      updateUser({
        displayName: profileData.displayName,
        bio: profileData.bio,
        school: profileData.school
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Failed to update profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Check current password
      const { data: isValid } = await supabase
        .rpc('validate_password', {
          username: user.username,
          password: currentPassword
        });

      if (!isValid) {
        toast({
          title: "Invalid password",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        setIsChangingPassword(false);
        return;
      }
      
      const success = await updatePassword(newPassword);
      
      if (success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully"
        });
      }
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Failed to change password",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setIsSavingNotifications(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notif_messages: notifications.newMessages,
          notif_friend_requests: notifications.friendRequests,
          notif_mentions: notifications.mentions,
          notif_announcements: notifications.announcements,
          notif_comment_replies: notifications.commentReplies,
          notif_post_likes: notifications.postLikes,
          notif_friend_activity: notifications.friendActivity,
          notif_email: notifications.emailNotifications
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast({
        title: "Notification preferences saved",
        description: "Your notification settings have been updated"
      });
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };
  
  const handleSavePrivacySettings = async () => {
    if (!user) return;
    
    setIsSavingPrivacy(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_profile: privacySettings.profileVisibility,
          privacy_online_status: privacySettings.onlineStatus,
          privacy_activity_status: privacySettings.activityStatus,
          privacy_read_receipts: privacySettings.readReceipts,
          privacy_searchable: privacySettings.searchable,
          privacy_data_sharing: privacySettings.dataSharing
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast({
        title: "Privacy settings saved",
        description: "Your privacy settings have been updated"
      });
    } catch (error: any) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };
  
  const handleSaveSecuritySettings = async () => {
    if (!user) return;
    
    setIsSavingSecurity(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          security_2fa: securitySettings.twoFactorEnabled,
          security_login_notif: securitySettings.loginNotifications,
          security_account_activity: securitySettings.accountActivity,
          security_alerts: securitySettings.securityAlerts
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast({
        title: "Security settings saved",
        description: "Your security settings have been updated"
      });
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingSecurity(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details and photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                      <Avatar className="h-24 w-24 mb-2">
                        <AvatarImage 
                          src={avatarPreview || user?.avatar} 
                          alt={user?.displayName} 
                        />
                        <AvatarFallback className="text-xl">
                          {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAvatarClick}
                      >
                        Change Avatar
                      </Button>
                      
                      {avatarPreview && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profileData.username}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Your username cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={profileData.displayName}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Select
                          value={profileData.pronouns}
                          onValueChange={(value) => setProfileData({...profileData, pronouns: value})}
                        >
                          <SelectTrigger id="pronouns">
                            <SelectValue placeholder="Select your pronouns" />
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input
                          id="birthday"
                          name="birthday"
                          type="date"
                          value={profileData.birthday}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="school">School</Label>
                        <Input
                          id="school"
                          name="school"
                          value={profileData.school}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profileData.location}
                          onChange={handleProfileInputChange}
                          placeholder="Your location"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileInputChange}
                        placeholder="Tell us about yourself"
                        className="resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Login Notifications</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Account Activity</h3>
                      <p className="text-sm text-muted-foreground">Track your account activity and sessions</p>
                    </div>
                    <Switch
                      checked={securitySettings.accountActivity}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, accountActivity: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Security Alerts</h3>
                      <p className="text-sm text-muted-foreground">Receive alerts about suspicious activity</p>
                    </div>
                    <Switch
                      checked={securitySettings.securityAlerts}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSecuritySettings} disabled={isSavingSecurity}>
                    {isSavingSecurity ? 'Saving...' : 'Save Security Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                  
                  <Button variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control which notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Messages</h3>
                      <p className="text-sm text-muted-foreground">Get notified when you receive a new message</p>
                    </div>
                    <Switch
                      checked={notifications.newMessages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newMessages: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Friend Requests</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone sends you a friend request</p>
                    </div>
                    <Switch
                      checked={notifications.friendRequests}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, friendRequests: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Mentions</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone mentions you in a post</p>
                    </div>
                    <Switch
                      checked={notifications.mentions}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, mentions: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Comment Replies</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone replies to your comment</p>
                    </div>
                    <Switch
                      checked={notifications.commentReplies}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, commentReplies: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Post Likes</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone likes your post</p>
                    </div>
                    <Switch
                      checked={notifications.postLikes}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, postLikes: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Friend Activity</h3>
                      <p className="text-sm text-muted-foreground">Get notified about your friends' activities</p>
                    </div>
                    <Switch
                      checked={notifications.friendActivity}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, friendActivity: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Announcements</h3>
                      <p className="text-sm text-muted-foreground">Receive announcements about new features and updates</p>
                    </div>
                    <Switch
                      checked={notifications.announcements}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, announcements: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                    {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your profile and activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}
                    >
                      <SelectTrigger id="profileVisibility">
                        <SelectValue placeholder="Who can see your profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">
                          <div className="flex items-center">
                            <Globe className="mr-2 h-4 w-4" />
                            <span>Everyone</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="friends">
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            <span>Friends Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <Lock className="mr-2 h-4 w-4" />
                            <span>Private</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Online Status</h3>
                      <p className="text-sm text-muted-foreground">Show others when you're online</p>
                    </div>
                    <Switch
                      checked={privacySettings.onlineStatus}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, onlineStatus: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Activity Status</h3>
                      <p className="text-sm text-muted-foreground">Show your activity status to others</p>
                    </div>
                    <Switch
                      checked={privacySettings.activityStatus}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, activityStatus: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Read Receipts</h3>
                      <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
                    </div>
                    <Switch
                      checked={privacySettings.readReceipts}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, readReceipts: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Search Visibility</h3>
                      <p className="text-sm text-muted-foreground">Allow others to find you in search</p>
                    </div>
                    <Switch
                      checked={privacySettings.searchable}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, searchable: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Data Sharing</h3>
                      <p className="text-sm text-muted-foreground">Allow usage data to be shared for service improvement</p>
                    </div>
                    <Switch
                      checked={privacySettings.dataSharing}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, dataSharing: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacySettings} disabled={isSavingPrivacy}>
                    {isSavingPrivacy ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
