
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUploadImage } from '@/hooks/use-upload-image';
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
import { Loader2, Camera, Trash2, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useUploadImage();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create a local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      form.setValue('avatar', imageUrl);
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been uploaded.",
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    form.setValue('avatar', '');
    setAvatarPreview(null);
  };

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Updating profile with data:", data);
      
      // First update the user profile in Supabase directly
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: data.displayName,
            bio: data.bio,
            school: data.school,
            avatar_url: data.avatar, // This is the key field for avatar
            location: data.location,
          })
          .eq('id', user?.id);
          
        if (error) {
          console.error('Failed to update profile in Supabase:', error);
          throw error;
        }
        
        console.log("Profile updated in Supabase successfully");
      } catch (supabaseError) {
        console.error('Supabase update error:', supabaseError);
        toast({
          title: "Database Error",
          description: "There was an error updating your profile in the database.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Then update the local profile state via auth context
      const success = await updateUserProfile(data);
      
      if (success) {
        // Update local user state with new data to reflect changes immediately
        if (user) {
          user.displayName = data.displayName;
          user.avatar = data.avatar || user.avatar;
          user.school = data.school;
          user.bio = data.bio;
          user.location = data.location;
        }
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        toast({
          title: "Failed to update profile state",
          description: "Your profile was saved to the database but there was an error updating your local profile. Try refreshing the page.",
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
            <Avatar className="h-24 w-24 md:h-36 md:h-36 border-2 border-border shadow-md cursor-pointer" onClick={triggerFileSelect}>
              <AvatarImage src={avatarPreview || ""} alt={user?.displayName || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || <UserRound />}
              </AvatarFallback>
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </Avatar>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={triggerFileSelect}
                        disabled={isUploading}
                        className="flex-grow md:flex-grow-0"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      
                      {avatarPreview && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleRemoveAvatar}
                          className="flex-grow md:flex-grow-0"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Upload a JPG, PNG, GIF or WebP image (max 5MB)
                    </p>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/avatar.jpg" 
                      {...field} 
                      value={field.value || ''} 
                      className="hidden"
                    />
                  </FormControl>
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
        
        <Button type="submit" disabled={isSubmitting || isUploading} className="w-full sm:w-auto">
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
