
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, Image, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }).optional(),
  school: z.string().min(2, {
    message: "School must be at least 2 characters.",
  }),
  location: z.string().max(100, {
    message: "Location must not be longer than 100 characters.",
  }).optional(),
  avatar: z.string().url({
    message: "Please enter a valid URL for your avatar.",
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileUpdateForm = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

  const defaultValues: Partial<ProfileFormValues> = {
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    school: user?.school || '',
    location: user?.location || '',
    avatar: user?.avatar || '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  // Update avatar preview when the form field changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'avatar' && value.avatar) {
        setAvatarPreview(value.avatar as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Set initial avatar preview
  React.useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const success = await updateUserProfile(data);
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        toast({
          title: "Failed to update profile",
          description: "There was an error updating your profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Preview and Input */}
        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 mb-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={avatarPreview || ""} alt={user?.displayName || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || <UserRound />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/avatar.jpg" 
                        {...field} 
                        value={field.value || ''} 
                        className="flex-1"
                      />
                      {field.value && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            form.setValue('avatar', '');
                            setAvatarPreview(null);
                          }}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image (JPG, PNG, or GIF)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School</FormLabel>
              <FormControl>
                <Input placeholder="Your school" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Your location" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileUpdateForm;
