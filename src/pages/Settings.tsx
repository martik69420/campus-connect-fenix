
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
  LogOut,
  Lock,
  Palette,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border/60">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              orientation={isMobile ? "horizontal" : "vertical"}
              className={isMobile ? "flex flex-col" : "flex overflow-hidden"}
            >
              <div className={isMobile ? "border-b" : "w-64 border-r h-full p-4 bg-muted/5"}>
                <TabsList className={isMobile ? "w-full grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4" : "flex flex-col w-full space-y-1"}>
                  <TabsTrigger value="profile" className={isMobile ? "" : "justify-start text-left pl-2"}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="account" className={isMobile ? "" : "justify-start text-left pl-2"}>
                    <UserCog className="h-4 w-4 mr-2" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className={isMobile ? "" : "justify-start text-left pl-2"}>
                    <Palette className="h-4 w-4 mr-2" />
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

              <div className={isMobile ? "p-0" : "flex-1 p-6"}>
                <TabsContent value="profile" className="focus-visible:outline-none">
                  <motion.div
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                        <CardTitle className="text-xl flex items-center">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          Profile Settings
                        </CardTitle>
                        <CardDescription>
                          Update your profile information and how others see you
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">                        
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
                          <Button onClick={saveSettings} className="bg-primary">Save Changes</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="account" className="focus-visible:outline-none">
                  <motion.div
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                        <CardTitle className="text-xl flex items-center">
                          <UserCog className="h-5 w-5 mr-2 text-primary" />
                          Account Settings
                        </CardTitle>
                        <CardDescription>
                          Manage your account details and security
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">                        
                        <div>
                          <h3 className="text-base font-medium mb-3">Your Details</h3>
                          <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                            <div className="grid gap-2">
                              <Label htmlFor="username">Username</Label>
                              <Input id="username" value={user?.username || ''} disabled 
                                className="bg-background/50" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" value={user?.email || ''} disabled 
                                className="bg-background/50" />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-base font-medium mb-3 flex items-center">
                            <Lock className="h-4 w-4 mr-2 text-primary" />
                            Change Password
                          </h3>
                          <div className="space-y-3 p-4 bg-card rounded-lg border border-border/60">
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
                              className={cn(isChangingPassword ? "opacity-70" : "")}
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
                  </motion.div>
                </TabsContent>

                <TabsContent value="appearance" className="focus-visible:outline-none">
                  <motion.div
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                        <CardTitle className="text-xl flex items-center">
                          <Palette className="h-5 w-5 mr-2 text-primary" />
                          Appearance
                        </CardTitle>
                        <CardDescription>
                          Customize how Campus Connect looks on your device
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">                      
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                {theme === 'dark' ? (
                                  <Moon className="h-5 w-5 text-primary" />
                                ) : (
                                  <Sun className="h-5 w-5 text-amber-500" />
                                )}
                              </div>
                              <div>
                                <Label htmlFor="dark-mode" className="font-medium">Theme</Label>
                                <p className="text-sm text-muted-foreground">
                                  {theme === 'dark' ? 'Dark mode is enabled' : 'Light mode is enabled'}
                                </p>
                              </div>
                            </div>
                            <Switch 
                              id="dark-mode" 
                              checked={theme === 'dark'}
                              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <Smartphone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Label htmlFor="reduce-motion" className="font-medium">Reduce Motion</Label>
                                <p className="text-sm text-muted-foreground">
                                  Decrease the amount of animations
                                </p>
                              </div>
                            </div>
                            <Switch id="reduce-motion" />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <Globe className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Label htmlFor="language" className="font-medium">Language</Label>
                                <p className="text-sm text-muted-foreground">
                                  Choose your preferred language
                                </p>
                              </div>
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
                          <Button onClick={saveSettings} className="bg-primary">Save Preferences</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="notifications" className="focus-visible:outline-none">
                  <motion.div
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                        <CardTitle className="text-xl flex items-center">
                          <Bell className="h-5 w-5 mr-2 text-primary" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>
                          Control what notifications you receive and how
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">                        
                        <div className="space-y-4 p-4 bg-secondary/10 rounded-lg">
                          <h3 className="text-base font-medium">Delivery Methods</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="email-notifications">Email Notifications</Label>
                              <p className="text-xs text-muted-foreground">
                                Receive notifications via email
                              </p>
                            </div>
                            <Switch 
                              id="email-notifications" 
                              checked={notificationSettings.emailNotifications}
                              onCheckedChange={() => handleToggleChange('emailNotifications', 'notification')}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="push-notifications">Push Notifications</Label>
                              <p className="text-xs text-muted-foreground">
                                Receive notifications on your device
                              </p>
                            </div>
                            <Switch 
                              id="push-notifications" 
                              checked={notificationSettings.pushNotifications}
                              onCheckedChange={() => handleToggleChange('pushNotifications', 'notification')}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4 p-4 bg-primary/5 rounded-lg">
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
                          <Button onClick={saveSettings} className="bg-primary">Save Preferences</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="privacy" className="focus-visible:outline-none">
                  <motion.div
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <PrivacySettings />
                  </motion.div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
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
