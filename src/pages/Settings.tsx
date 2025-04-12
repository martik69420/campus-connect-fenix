
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  ShieldAlert, 
  Globe, 
  Eye, 
  Moon,
  Sun,
  Smartphone,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useViewport } from '@/hooks/use-viewport';
import ProfileUpdateForm from '@/components/profile/ProfileUpdateForm';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';

const Settings: React.FC = () => {
  const { user, logout, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { isMobile } = useViewport();
  
  const [profileVisibility, setProfileVisibility] = useState({
    isPublic: true,
    showEmail: false,
    showSchool: true,
    showLocation: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    friendRequestNotifications: true,
    messageNotifications: true,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({ title: "Error", description: "Please fill all password fields", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "New passwords don't match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        toast({ title: "Success", description: "Password changed successfully" });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleChange = (setting: string, section: 'profile' | 'notification') => {
    if (section === 'profile') {
      setProfileVisibility(prev => ({
        ...prev,
        [setting]: !prev[setting as keyof typeof prev]
      }));
    } else {
      setNotificationSettings(prev => ({
        ...prev,
        [setting]: !prev[setting as keyof typeof prev]
      }));
    }
    
    toast({ 
      title: "Setting updated", 
      description: `Your preference has been saved.` 
    });
  };

  // Save settings (for demo purposes only)
  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            orientation={isMobile ? "horizontal" : "vertical"}
            className={isMobile ? "flex flex-col" : "flex space-x-6 border rounded-lg overflow-hidden"}
          >
            <div className={isMobile ? "border-b" : "w-1/4 border-r h-full p-4 bg-muted/10"}>
              <TabsList className={isMobile ? "w-full grid grid-cols-2 mb-4" : "flex flex-col w-full space-y-1"}>
                <TabsTrigger value="profile" className={isMobile ? "" : "justify-start text-left pl-2"}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="account" className={isMobile ? "" : "justify-start text-left pl-2"}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="appearance" className={isMobile ? "" : "justify-start text-left pl-2"}>
                  <Eye className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="notifications" className={isMobile ? "" : "justify-start text-left pl-2"}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className={isMobile ? "" : "justify-start text-left pl-2"}>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              {!isMobile && (
                <div className="pt-6 mt-6 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>
              )}
            </div>

            <div className={isMobile ? "p-0" : "flex-1 p-4"}>
              <TabsContent value="profile" className="focus-visible:outline-none">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-xl font-semibold">Profile Settings</h2>
                    
                    {user && (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className={isMobile ? "w-full" : "w-1/3"}>
                            <h3 className="text-base font-medium mb-4">Profile Picture</h3>
                            <ProfilePictureUpload />
                          </div>
                          
                          <div className={isMobile ? "w-full" : "w-2/3"}>
                            <h3 className="text-base font-medium mb-4">Profile Information</h3>
                            <ProfileUpdateForm />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="focus-visible:outline-none">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-xl font-semibold">Account Settings</h2>
                    
                    <div>
                      <h3 className="text-base font-medium mb-2">Your Details</h3>
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={user?.username || ''} disabled />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={user?.email || ''} disabled />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-base font-medium mb-2">Change Password</h3>
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input 
                            id="currentPassword" 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input 
                            id="newPassword" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleChangePassword} 
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-2">
                      <Button 
                        variant="destructive" 
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="focus-visible:outline-none">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                        </div>
                        <Switch 
                          id="dark-mode" 
                          checked={theme === 'dark'}
                          onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <Label htmlFor="reduce-motion">Reduce Motion</Label>
                        </div>
                        <Switch id="reduce-motion" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <Label htmlFor="language">Language</Label>
                        </div>
                        <select 
                          id="language"
                          className="rounded border p-2 text-sm bg-background"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>Save Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="focus-visible:outline-none">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-xl font-semibold">Notification Preferences</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <Switch 
                          id="email-notifications" 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={() => handleToggleChange('emailNotifications', 'notification')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <Switch 
                          id="push-notifications" 
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={() => handleToggleChange('pushNotifications', 'notification')}
                        />
                      </div>
                      
                      <Separator />
                      <h3 className="text-base font-medium">Notify me about</h3>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="like-notifications">Likes on my posts</Label>
                        <Switch 
                          id="like-notifications" 
                          checked={notificationSettings.likeNotifications}
                          onCheckedChange={() => handleToggleChange('likeNotifications', 'notification')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="comment-notifications">Comments on my posts</Label>
                        <Switch 
                          id="comment-notifications" 
                          checked={notificationSettings.commentNotifications}
                          onCheckedChange={() => handleToggleChange('commentNotifications', 'notification')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="friend-notifications">Friend requests</Label>
                        <Switch 
                          id="friend-notifications" 
                          checked={notificationSettings.friendRequestNotifications}
                          onCheckedChange={() => handleToggleChange('friendRequestNotifications', 'notification')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message-notifications">New messages</Label>
                        <Switch 
                          id="message-notifications" 
                          checked={notificationSettings.messageNotifications}
                          onCheckedChange={() => handleToggleChange('messageNotifications', 'notification')}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>Save Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="focus-visible:outline-none">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-xl font-semibold">Privacy Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="public-profile">Public Profile</Label>
                        <Switch 
                          id="public-profile" 
                          checked={profileVisibility.isPublic}
                          onCheckedChange={() => handleToggleChange('isPublic', 'profile')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-email">Show Email</Label>
                        <Switch 
                          id="show-email" 
                          checked={profileVisibility.showEmail}
                          onCheckedChange={() => handleToggleChange('showEmail', 'profile')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-school">Show School</Label>
                        <Switch 
                          id="show-school" 
                          checked={profileVisibility.showSchool}
                          onCheckedChange={() => handleToggleChange('showSchool', 'profile')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-location">Show Location</Label>
                        <Switch 
                          id="show-location" 
                          checked={profileVisibility.showLocation}
                          onCheckedChange={() => handleToggleChange('showLocation', 'profile')}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-base font-medium mb-2">Activity Privacy</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-activity">Show my activity</Label>
                          <Switch id="show-activity" defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-liked">Show posts I've liked</Label>
                          <Switch id="show-liked" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-friends">Show my friends list</Label>
                          <Switch id="show-friends" defaultChecked />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>Save Privacy Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
          
          {isMobile && (
            <Card className="mb-safe">
              <CardContent className="p-6">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
