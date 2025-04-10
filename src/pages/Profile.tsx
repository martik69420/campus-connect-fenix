import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Copy, Mail, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

// Define a schema for the profile update form
const profileUpdateSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must be less than 160 characters.",
  }).optional(),
  location: z.string().optional(),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional(),
  birthday: z.date().optional(),
  availableForHire: z.boolean().default(false).optional(),
})

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  
  const form = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
      location: "",
      website: "",
      birthday: undefined,
      availableForHire: false,
    },
    mode: "onChange",
  })
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    if (username) {
      fetchProfile(username);
    }
  }, [username, isAuthenticated, isLoading, navigate]);
  
  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        birthday: profile.birthday ? new Date(profile.birthday) : undefined,
        availableForHire: profile.available_for_hire || false,
      });
      setInitialValues({
        displayName: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        birthday: profile.birthday ? new Date(profile.birthday) : undefined,
        availableForHire: profile.available_for_hire || false,
      });
    }
  }, [profile, form]);
  
  const fetchProfile = async (username: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile.",
          variant: "destructive"
        });
      }
      
      if (data) {
        setProfile(data);
      } else {
        // If no profile found, redirect to a 404 page or handle the case accordingly
        navigate('/not-found');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset(initialValues);
  };
  
  const onSubmit = async (values: z.infer<typeof profileUpdateSchema>) => {
    setIsSaving(true);
    try {
      const success = await updateUserProfile({
        displayName: values.displayName,
        username: values.username,
        bio: values.bio,
        location: values.location,
        website: values.website,
        birthday: values.birthday ? values.birthday.toISOString() : null,
        availableForHire: values.availableForHire,
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        // Refresh the profile data
        fetchProfile(values.username);
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: message });
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-lg font-medium">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg font-medium">Profile not found.</p>
        </div>
      </AppLayout>
    );
  }
  
  const isOwnProfile = user?.username === profile?.username;
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEditing ? "Edit Profile" : "Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Display Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write a short bio about yourself"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Write a short bio about yourself. Max 160 characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="Website" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birthday</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DatePicker
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              setDate={field.onChange} // Add the missing setDate prop
                              disabled={false}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Your birthday will not be publicly displayed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="availableForHire"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Available for hire</FormLabel>
                          <FormDescription>
                            Let others know that you are open to job opportunities.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                    <Button type="submit" disabled={isSaving || !form.formState.isValid}>
                      {isSaving ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                          Saving...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <ProfilePictureUpload />
                  <div>
                    <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.available_for_hire && (
                      <Badge variant="secondary">Available for Hire</Badge>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Profile Information</h3>
                  <div className="text-muted-foreground space-y-1">
                    {profile.bio && (
                      <p>{profile.bio}</p>
                    )}
                    {profile.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center space-x-2">
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                          {profile.website}
                        </a>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(profile.website, "Website URL copied to clipboard.")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {profile.birthday && (
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(profile.birthday).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <div className="text-muted-foreground space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(profile.email, "Email copied to clipboard.")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <Button onClick={handleEditProfile}>Edit Profile</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
