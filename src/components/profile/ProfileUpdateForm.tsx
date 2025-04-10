
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User, School, FileText } from 'lucide-react';
import ProfilePictureUpload from './ProfilePictureUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileUpdateForm = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultValues: Partial<ProfileFormValues> = {
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    school: user?.school || '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Reset form when user data changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        bio: user.bio || '',
        school: user.school || '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Updating profile with data:", data);
      
      const profileData = {
        displayName: data.displayName,
        bio: data.bio || null,
        school: data.school,
      };
      
      // First try to update directly via Supabase to see errors
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: profileData.displayName,
            bio: profileData.bio,
            school: profileData.school,
          })
          .eq('id', user?.id || '');
        
        if (error) {
          console.error("Failed to update profile in Supabase:", error);
          throw new Error(error.message);
        }
      } catch (error: any) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      // If direct update succeeds, update the context as well
      const success = await updateUserProfile(profileData);
      
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
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload with improved UI */}
        <Card className="p-4">
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 mb-6">
            <ProfilePictureUpload />
            
            <div className="flex-1 space-y-2">
              <h3 className="font-medium text-lg">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Upload a profile picture to personalize your account. 
                JPG, PNG, GIF or WebP, max 5MB.
              </p>
            </div>
          </div>
        </Card>
        
        {/* Form Fields with Icons */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <Separator className="my-4" />
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your display name" 
                      {...field} 
                      className="transition-all focus:border-primary"
                    />
                  </FormControl>
                  <FormDescription>
                    This is how others will see you on the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bio
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none min-h-[100px] transition-all focus:border-primary"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Share a brief description about yourself (max 160 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    School
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your school or university" 
                      {...field}
                      className="transition-all focus:border-primary" 
                    />
                  </FormControl>
                  <FormDescription>
                    The educational institution you're associated with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.formState.isDirty} 
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProfileUpdateForm;
