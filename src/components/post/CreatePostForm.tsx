
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, X, Loader2, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import { supabase } from '@/integrations/supabase/client';
import MentionInput from '@/components/common/MentionInput';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPost } = usePost();
  
  // Handle image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    const newFiles = Array.from(e.target.files);
    const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...newFiles]);
    setImages(prev => [...prev, ...newImageUrls]);
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Process mentions from content
  const processMentions = async (text: string): Promise<string[]> => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    
    if (!matches) return [];
    
    const usernames = matches.map(match => match.substring(1));
    const uniqueUsernames = [...new Set(usernames)];
    
    // Check if these users exist
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', uniqueUsernames);
    
    return data?.map(profile => profile.id) || [];
  };
  
  // Upload images to Supabase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        // Upload to the 'post-images' bucket
        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(`public/${fileName}`, file);
        
        if (error) {
          console.error('Error uploading image:', error);
          toast({
            title: 'Image upload failed',
            description: error.message,
            variant: 'destructive'
          });
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(`public/${fileName}`);
        
        console.log('Uploaded image URL:', publicUrl);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Exception during image upload:', error);
      }
    }
    
    return uploadedUrls;
  };
  
  // Handle post submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some text or images to your post.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images if any
      let uploadedImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages();
        console.log('Final uploaded URLs:', uploadedImageUrls);
      }
      
      // Find all mentioned users
      const mentionedUserIds = await processMentions(content);
      
      // Create post
      const postData = await createPost(content, uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined);
      
      // Send notifications to mentioned users
      if (mentionedUserIds.length > 0 && user) {
        // Create notification for each mentioned user
        for (const userId of mentionedUserIds) {
          if (userId !== user.id) { // Don't notify yourself
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'mention',
              content: `${user.displayName || user.username} mentioned you in a post`,
              related_id: postData?.id, // Use the post ID if available
              is_read: false
            });
          }
        }
      }
      
      // Reset form
      setContent('');
      setImages([]);
      setImageFiles([]);
      
      toast({
        title: "Post created!",
        description: "Your post has been published.",
      });
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Could not create your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle inserting @ mention
  const handleAddMention = () => {
    setContent(prev => prev + '@');
    
    // Focus the textarea
    setTimeout(() => {
      const textArea = document.querySelector('textarea');
      if (textArea) {
        textArea.focus();
        const cursorPos = textArea.value.length;
        textArea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.displayName} />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <MentionInput
                value={content}
                onChange={setContent}
                placeholder="What's on your mind? Use @ to mention friends"
                className="min-h-[100px] resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              
              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-2 mt-2"
                  >
                    {images.map((img, index) => (
                      <motion.div 
                        key={index}
                        className="relative rounded-md overflow-hidden group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img src={img} alt={`Selected ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    Add Image
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={handleAddMention}
                  >
                    <AtSign className="h-4 w-4 mr-2" />
                    Mention
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting || (content.trim() === '' && images.length === 0)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
