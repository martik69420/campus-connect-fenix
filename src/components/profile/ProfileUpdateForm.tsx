
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfilePictureUpload from './ProfilePictureUpload';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Add onComplete prop to component props interface
interface ProfileUpdateFormProps {
  onComplete?: () => void;
}

const profileSchema = z.object({
  display_name: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(50),
  bio: z.string().max(500, {
    message: "Bio must be 500 characters or less.",
  }).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal('')),
  school: z.string().max(100).optional(),
  interests: z.array(z.string()).optional(),
});

const ProfileUpdateForm: React.FC<ProfileUpdateFormProps> = ({ onComplete }) => {
  const { user, updateUserProfile } = useAuth(); // Changed updateProfile to updateUserProfile
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [interestsInput, setInterestsInput] = useState<string>('');
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.displayName || '', 
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '', 
      school: user?.school || '',
      interests: user?.interests || [] as string[], 
    },
  });

  useEffect(() => {
    if (user) {
      // Set default form values from user object
      form.reset({
        display_name: user.displayName || '', 
        bio: user.bio || '',
        location: user.location || '',
        website: user?.website || '', 
        school: user.school || '',
        interests: user?.interests || [] as string[], 
      });
    }
  }, [user, form]);

  const handleAddInterest = () => {
    if (!interestsInput.trim()) return;
    
    const currentInterests = form.getValues('interests') || [];
    if (Array.isArray(currentInterests) && !currentInterests.includes(interestsInput.trim())) {
      form.setValue('interests', [...currentInterests, interestsInput.trim()]);
    }
    setInterestsInput('');
  };

  const handleRemoveInterest = (interest: string) => {
    const currentInterests = form.getValues('interests') || [];
    if (Array.isArray(currentInterests)) {
      form.setValue(
        'interests', 
        currentInterests.filter(i => i !== interest)
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Handle avatar upload if there's a new file
      let avatarUrl = user.avatar;
      
      if (avatarFile) {
        const fileName = `${user.id}_${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = urlData.publicUrl;
      }
      
      const updateData = {
        displayName: data.display_name, // Map form data to expected format
        bio: data.bio,
        location: data.location,
        website: data.website,
        school: data.school,
        avatar: avatarUrl,
        interests: data.interests
      };
      
      await updateUserProfile(updateData);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // If no callback, navigate back to profile
        navigate(`/profile/${user.username}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="bg-secondary/5 pb-2">
        <CardTitle className="text-xl">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center mb-4">
              <ProfilePictureUpload 
                currentAvatar={user?.avatar} 
                onFileSelect={setAvatarFile}
                previewUrl={avatarPreview}
                setPreviewUrl={setAvatarPreview}
              />
            </div>
            
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                      placeholder="Tell us about yourself"
                      className="min-h-32 resize-none"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School/Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="Your school or institution" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Interests</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value && Array.isArray(field.value) && field.value.length > 0 ? (
                      field.value.map((interest, index) => (
                        <div 
                          key={index}
                          className="flex items-center bg-secondary/20 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{interest}</span>
                          <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveInterest(interest)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No interests added yet</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add an interest"
                      value={interestsInput}
                      onChange={(e) => setInterestsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddInterest}
                    >
                      Add
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  } else {
                    navigate(`/profile/${user?.username}`);
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileUpdateForm;
