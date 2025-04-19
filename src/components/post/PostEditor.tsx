import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Image as ImageIcon, Smile, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { usePost } from '@/context/PostContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import Picker from '@emoji-mart/react';
import { useTheme } from '@/context/ThemeContext';

interface PostEditorProps {
  onPostCreated?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const PostEditor: React.FC<PostEditorProps> = ({
  onPostCreated,
  placeholder,
  autoFocus = false,
  className = '',
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { createPost } = usePost();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast({
        title: t('post.emptyPost'),
        description: t('post.enterContent'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images if any
      let uploadedImageUrls: string[] = [];
      
      if (images.length > 0) {
        uploadedImageUrls = await Promise.all(
          images.map(async (image) => {
            const fileExt = image.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('post_images')
              .upload(filePath, image);
              
            if (uploadError) {
              throw uploadError;
            }
            
            const { data } = supabase.storage
              .from('post_images')
              .getPublicUrl(filePath);
              
            return data.publicUrl;
          })
        );
      }
      
      // Create the post with uploaded image URLs
      await createPost(content, uploadedImageUrls);
      
      // Reset form
      setContent('');
      setImages([]);
      setImageUrls([]);
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
      
      toast({
        title: t('post.postCreated'),
        description: t('post.postSuccess'),
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: t('post.postFailed'),
        description: error.message || t('post.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 4 images
      if (images.length + selectedFiles.length > 4) {
        toast({
          title: t('post.tooManyImages'),
          description: t('post.maxFourImages'),
          variant: "destructive",
        });
        return;
      }
      
      // Check file sizes (max 5MB each)
      const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: t('post.imageTooLarge'),
          description: t('post.maxImageSize'),
          variant: "destructive",
        });
        return;
      }
      
      setImages(prev => [...prev, ...selectedFiles]);
      
      // Create object URLs for preview
      const newImageUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: any) => {
    setContent(prev => prev + emoji.native);
    setEmojiPickerOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder || t('post.whatsOnYourMind')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] resize-none pr-10"
          disabled={isSubmitting}
        />
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              size="icon" 
              variant="ghost" 
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              disabled={isSubmitting}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 border-none bg-transparent" side="top" align="end">
            <Picker 
              onEmojiSelect={handleEmojiSelect}
              theme={theme === 'dark' ? 'dark' : 'light'}
              previewPosition="none"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-md overflow-hidden border bg-muted/20">
              <img 
                src={url} 
                alt={`Preview ${index}`} 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            className="hidden"
            disabled={isSubmitting || images.length >= 4}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || images.length >= 4}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {t('post.addImage')}
          </Button>
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('post.posting')}
            </>
          ) : (
            t('post.post')
          )}
        </Button>
      </div>
    </form>
  );
};

export default PostEditor;
