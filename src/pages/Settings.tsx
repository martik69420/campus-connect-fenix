
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { BellRing, Globe, Palette, Shield, User2, Moon, Sun, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Settings = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null;
  }

  const handleLanguageChange = async (newLanguage: any) => {
    try {
      await setLanguage(newLanguage);
      toast({
        title: t('settings.languageUpdated'),
        description: t('settings.languageUpdatedDesc'),
      });
    } catch (error) {
      console.error('Failed to update language:', error);
      toast({
        title: t('common.error'),
        description: t('settings.languageUpdateError'),
        variant: 'destructive'
      });
    }
  };

  const handleThemeToggle = async () => {
    try {
      await toggleTheme();
      toast({
        title: theme === 'light' ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled'),
      });
    } catch (error) {
      console.error('Failed to toggle theme:', error);
      toast({
        title: t('common.error'),
        description: t('settings.themeUpdateError'),
        variant: 'destructive'
      });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
            <p className="text-muted-foreground">
              {t('settings.description')}
            </p>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 md:grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.profile')}</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.appearance')}</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.language')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.notifications')}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.privacy')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.profileSettings')}</CardTitle>
                  <CardDescription>
                    {t('settings.profileSettingsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar || ""} alt={user.displayName || ""} />
                      <AvatarFallback className="text-lg">
                        {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.displayName}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full sm:w-auto">
                    {t('settings.updateProfile')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.accountSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.themeSettings')}</CardTitle>
                  <CardDescription>
                    {t('settings.themeSettingsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5" />
                      ) : (
                        <Sun className="h-5 w-5" />
                      )}
                      <div className="grid gap-0.5">
                        <Label htmlFor="theme-mode">
                          {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {theme === 'dark' 
                            ? t('settings.darkModeDesc') 
                            : t('settings.lightModeDesc')}
                        </span>
                      </div>
                    </div>
                    <Switch
                      id="theme-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={handleThemeToggle}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.languageSettings')}</CardTitle>
                  <CardDescription>
                    {t('settings.languageSettingsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={language} 
                    onValueChange={handleLanguageChange}
                    className="space-y-3"
                  >
                    {availableLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        className="flex items-center space-x-2 rounded-md border p-3"
                      >
                        <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
                        <Label htmlFor={`lang-${lang.code}`} className="flex-1">
                          {lang.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notificationSettings')}</CardTitle>
                  <CardDescription>
                    {t('settings.notificationSettingsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-messages">
                        {t('settings.messageNotifications')}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.messageNotificationsDesc')}
                      </span>
                    </div>
                    <Switch id="notify-messages" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-likes">
                        {t('settings.likeNotifications')}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.likeNotificationsDesc')}
                      </span>
                    </div>
                    <Switch id="notify-likes" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-friends">
                        {t('settings.friendNotifications')}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.friendNotificationsDesc')}
                      </span>
                    </div>
                    <Switch id="notify-friends" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.privacySettings')}</CardTitle>
                  <CardDescription>
                    {t('settings.privacySettingsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="privacy-profile">
                        {t('settings.privateProfile')}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.privateProfileDesc')}
                      </span>
                    </div>
                    <Switch id="privacy-profile" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="privacy-online">
                        {t('settings.showOnlineStatus')}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.showOnlineStatusDesc')}
                      </span>
                    </div>
                    <Switch id="privacy-online" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
