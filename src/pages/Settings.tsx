
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, LanguageCode } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Profile schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  bio: z.string().max(160).optional(),
  school: z.string(),
  pronouns: z.string().optional(),
});

// Password schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Notification schema
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  mentions: z.boolean().default(true),
  commentReplies: z.boolean().default(true),
  friendRequests: z.boolean().default(true),
  friendActivity: z.boolean().default(true),
  postLikes: z.boolean().default(true),
  messages: z.boolean().default(true),
  announcements: z.boolean().default(false),
});

// Privacy schema
const privacyFormSchema = z.object({
  profileVisibility: z.string().default("everyone"),
  onlineStatus: z.boolean().default(true),
  activityStatus: z.boolean().default(true),
  readReceipts: z.boolean().default(true),
  searchable: z.boolean().default(true),
  dataSharing: z.boolean().default(false),
});

// Security schema
const securityFormSchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  loginNotifications: z.boolean().default(true),
  accountActivityAlerts: z.boolean().default(true),
  securityAlerts: z.boolean().default(true),
});

// Language schema
const languageFormSchema = z.object({
  language: z.string().default("nl"),
});

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, updateUserProfile, changePassword, validateCurrentPassword } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      school: user?.school || "",
      pronouns: "",
    },
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      mentions: true,
      commentReplies: true,
      friendRequests: true,
      friendActivity: true,
      postLikes: true,
      messages: true,
      announcements: false,
    },
  });
  
  // Privacy form
  const privacyForm = useForm<z.infer<typeof privacyFormSchema>>({
    resolver: zodResolver(privacyFormSchema),
    defaultValues: {
      profileVisibility: "everyone",
      onlineStatus: true,
      activityStatus: true,
      readReceipts: true,
      searchable: true,
      dataSharing: false,
    },
  });
  
  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      twoFactorAuth: false,
      loginNotifications: true,
      accountActivityAlerts: true,
      securityAlerts: true,
    },
  });
  
  // Language form
  const languageForm = useForm<z.infer<typeof languageFormSchema>>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      language: language,
    },
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Set default form values when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || "",
        bio: user.bio || "",
        school: user.school || "",
        pronouns: userSettings?.pronouns || "none",
      });
      
      setAvatarUrl(user.avatar);
    }
  }, [user, userSettings]);
  
  // Fetch user settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;
      
      try {
        setSettingsLoading(true);
        
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user settings:', error);
          return;
        }
        
        if (data) {
          setUserSettings(data);
          
          // Update forms with data
          notificationsForm.reset({
            emailNotifications: data.notif_email,
            pushNotifications: true,
            mentions: data.notif_mentions,
            commentReplies: data.notif_comment_replies,
            friendRequests: data.notif_friend_requests,
            friendActivity: data.notif_friend_activity,
            postLikes: data.notif_post_likes,
            messages: data.notif_messages,
            announcements: data.notif_announcements,
          });
          
          privacyForm.reset({
            profileVisibility: data.privacy_profile || "everyone",
            onlineStatus: data.privacy_online_status,
            activityStatus: data.privacy_activity_status,
            readReceipts: data.privacy_read_receipts,
            searchable: data.privacy_searchable,
            dataSharing: data.privacy_data_sharing,
          });
          
          securityForm.reset({
            twoFactorAuth: data.security_2fa,
            loginNotifications: data.security_login_notif,
            accountActivityAlerts: data.security_account_activity,
            securityAlerts: data.security_alerts,
          });
          
          languageForm.reset({
            language: data.language || language,
          });
          
          profileForm.setValue('pronouns', data.pronouns || "none");
        }
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [user]);
  
  // Handle profile form submit
  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Update profile
      const success = await updateUserProfile(user.id, {
        displayName: values.displayName,
        school: values.school,
        bio: values.bio,
        avatar: avatarUrl,
      });
      
      // Update pronouns in user_settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          pronouns: values.pronouns,
        }, {
          onConflict: 'user_id',
        });
      
      if (success) {
        toast({
          title: t('common.success'),
          description: t('settings.profile.updated'),
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('settings.profile.updateFailed'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: t('common.error'),
        description: t('settings.profile.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle password form submit
  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Validate current password
      const isValid = await validateCurrentPassword(user.id, values.currentPassword);
      
      if (!isValid) {
        toast({
          title: t('common.error'),
          description: t('settings.password.currentPasswordWrong'),
          variant: "destructive",
        });
        return;
      }
      
      // Change password
      const success = await changePassword(user.id, values.newPassword);
      
      if (success) {
        toast({
          title: t('common.success'),
          description: t('settings.password.updated'),
        });
        
        // Reset form
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('settings.password.updateFailed'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: t('common.error'),
        description: t('settings.password.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle notifications form submit
  const onNotificationsSubmit = async (values: z.infer<typeof notificationsFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notif_email: values.emailNotifications,
          notif_mentions: values.mentions,
          notif_comment_replies: values.commentReplies,
          notif_friend_requests: values.friendRequests,
          notif_friend_activity: values.friendActivity,
          notif_post_likes: values.postLikes,
          notif_messages: values.messages,
          notif_announcements: values.announcements,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) {
        console.error('Error updating notification settings:', error);
        toast({
          title: t('common.error'),
          description: t('settings.notifications.updateFailed'),
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t('common.success'),
        description: t('settings.notifications.updated'),
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.notifications.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle privacy form submit
  const onPrivacySubmit = async (values: z.infer<typeof privacyFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_profile: values.profileVisibility,
          privacy_online_status: values.onlineStatus,
          privacy_activity_status: values.activityStatus,
          privacy_read_receipts: values.readReceipts,
          privacy_searchable: values.searchable,
          privacy_data_sharing: values.dataSharing,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) {
        console.error('Error updating privacy settings:', error);
        toast({
          title: t('common.error'),
          description: t('settings.privacy.updateFailed'),
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t('common.success'),
        description: t('settings.privacy.updated'),
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.privacy.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle security form submit
  const onSecuritySubmit = async (values: z.infer<typeof securityFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          security_2fa: values.twoFactorAuth,
          security_login_notif: values.loginNotifications,
          security_account_activity: values.accountActivityAlerts,
          security_alerts: values.securityAlerts,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) {
        console.error('Error updating security settings:', error);
        toast({
          title: t('common.error'),
          description: t('settings.security.updateFailed'),
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t('common.success'),
        description: t('settings.security.updated'),
      });
    } catch (error) {
      console.error('Failed to update security settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.security.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle language form submit
  const onLanguageSubmit = async (values: z.infer<typeof languageFormSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      await setLanguage(values.language as LanguageCode);
      
      toast({
        title: t('common.success'),
        description: t('settings.language.updated'),
      });
    } catch (error) {
      console.error('Failed to update language settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.language.updateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    try {
      setIsUpdating(true);
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      setAvatarUrl(data.publicUrl);
      
      toast({
        title: t('common.success'),
        description: t('settings.avatar.uploaded'),
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast({
        title: t('common.error'),
        description: t('settings.avatar.uploadFailed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading || settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
            <TabsTrigger value="account">{t('settings.account.tab')}</TabsTrigger>
            <TabsTrigger value="profile">{t('settings.profile.tab')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings.notifications.tab')}</TabsTrigger>
            <TabsTrigger value="privacy">{t('settings.privacy.tab')}</TabsTrigger>
            <TabsTrigger value="security">{t('settings.security.tab')}</TabsTrigger>
            <TabsTrigger value="language">{t('settings.language.tab')}</TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.account.title')}</CardTitle>
                <CardDescription>{t('settings.account.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <Input
                    id="username"
                    value={user?.username || ""}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('settings.account.usernameNote')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Password Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t('settings.password.title')}</CardTitle>
                <CardDescription>{t('settings.password.description')}</CardDescription>
              </CardHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.password.current')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.password.new')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.password.confirm')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.password.update')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profile.title')}</CardTitle>
                <CardDescription>{t('settings.profile.description')}</CardDescription>
              </CardHeader>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={user?.displayName || ""} />
                          <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <Label 
                          htmlFor="avatar-upload" 
                          className="cursor-pointer text-sm text-primary hover:underline"
                        >
                          {t('settings.profile.uploadAvatar')}
                        </Label>
                        <Input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarUpload}
                          disabled={isUpdating}
                        />
                      </div>
                      
                      <div className="flex-1 space-y-4 w-full">
                        <FormField
                          control={profileForm.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('settings.profile.displayName')}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="school"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('settings.profile.school')}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="pronouns"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('settings.profile.pronouns')}</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('settings.profile.selectPronouns')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* Changed the empty string value to "none" */}
                                  <SelectItem value="none">{t('settings.profile.pronounsNotSay')}</SelectItem>
                                  <SelectItem value="he/him">{t('settings.profile.pronounsHe')}</SelectItem>
                                  <SelectItem value="she/her">{t('settings.profile.pronounsShe')}</SelectItem>
                                  <SelectItem value="they/them">{t('settings.profile.pronounsThey')}</SelectItem>
                                  <SelectItem value="other">{t('settings.profile.pronounsOther')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.profile.bio')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('settings.profile.bioPlaceholder')}
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('settings.profile.bioDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.profile.save')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>{t('settings.notifications.description')}</CardDescription>
              </CardHeader>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)}>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.email')}
                              </FormLabel>
                              <FormDescription>
                                {t('settings.notifications.emailDescription')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.push')}
                              </FormLabel>
                              <FormDescription>
                                {t('settings.notifications.pushDescription')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="mentions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.mentions')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="commentReplies"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.commentReplies')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="friendRequests"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.friendRequests')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="friendActivity"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.friendActivity')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="postLikes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.postLikes')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="messages"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.messages')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="announcements"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('settings.notifications.announcements')}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.notifications.save')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.privacy.title')}</CardTitle>
                <CardDescription>{t('settings.privacy.description')}</CardDescription>
              </CardHeader>
              <Form {...privacyForm}>
                <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={privacyForm.control}
                      name="profileVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.privacy.profileVisibility')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('settings.privacy.selectVisibility')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="everyone">{t('settings.privacy.everyone')}</SelectItem>
                              <SelectItem value="friends">{t('settings.privacy.friendsOnly')}</SelectItem>
                              <SelectItem value="private">{t('settings.privacy.private')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('settings.privacy.profileVisibilityDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="onlineStatus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.privacy.onlineStatus')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.privacy.onlineStatusDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="activityStatus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.privacy.activityStatus')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.privacy.activityStatusDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="readReceipts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.privacy.readReceipts')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.privacy.readReceiptsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="searchable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.privacy.searchable')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.privacy.searchableDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="dataSharing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.privacy.dataSharing')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.privacy.dataSharingDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.privacy.save')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.security.title')}</CardTitle>
                <CardDescription>{t('settings.security.description')}</CardDescription>
              </CardHeader>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.security.twoFactorAuth')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.security.twoFactorAuthDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="loginNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.security.loginNotifications')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.security.loginNotificationsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="accountActivityAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.security.accountActivityAlerts')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.security.accountActivityAlertsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="securityAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.security.securityAlerts')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.security.securityAlertsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.security.save')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          {/* Language Settings */}
          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language.title')}</CardTitle>
                <CardDescription>{t('settings.language.description')}</CardDescription>
              </CardHeader>
              <Form {...languageForm}>
                <form onSubmit={languageForm.handleSubmit(onLanguageSubmit)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={languageForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.language.select')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('settings.language.selectLanguage')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="nl">{t('settings.language.dutch')}</SelectItem>
                              <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                              <SelectItem value="fr">{t('settings.language.french')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('settings.language.selectDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('settings.language.save')}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
