
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, X, Image as ImageIcon, Smile } from 'lucide-react';
import MentionInput from './MentionInput';
import { useLanguage } from '@/context/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onSave: (updatedPost: { content: string, images?: string[] }) => Promise<void>;
}

// Import emoji picker dynamically to avoid SSR issues
const loadEmojiPicker = () => import('@emoji-mart/react').then(mod => mod.default);
const loadEmojiData = () => import('@emoji-mart/data').then(mod => mod.default);

const PostEditor: React.FC<PostEditorProps> = ({
  isOpen,
  onClose,
  post,
  onSave,
}) => {
  const [content, setContent] = useState(post?.content || '');
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [EmojiPicker, setEmojiPicker] = useState<any>(null);
  const [emojiData, setEmojiData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  // Load emoji picker dynamically
  const handleEmojiButtonClick = async () => {
    if (!EmojiPicker) {
      const [picker, data] = await Promise.all([loadEmojiPicker(), loadEmojiData()]);
      setEmojiPicker(() => picker);
      setEmojiData(data);
    }
    setEmojiPickerOpen(prev => !prev);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Check file type
      const validFiles = selectedFiles.filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length !== selectedFiles.length) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive"
        });
      }
      
      // Check max files (limit to 4 total)
      if (images.length + files.length + validFiles.length > 4) {
        toast({
          title: "Too many files",
          description: "Maximum 4 images allowed per post",
          variant: "destructive"
        });
        
        // Only add files up to the limit
        const availableSlots = 4 - images.length - files.length;
        setFiles(prev => [...prev, ...validFiles.slice(0, availableSlots)]);
      } else {
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleEmojiSelect = (emoji: any) => {
    setContent(prev => prev + emoji.native);
    setEmojiPickerOpen(false);
  };
  
  const handleSave = async () => {
    if (content.trim() === '' && images.length === 0 && files.length === 0) {
      toast({
        title: "Cannot save empty post",
        description: "Please add some content or images to your post",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let uploadedImageUrls: string[] = [...images];
      
      // Upload new image files if any
      if (files.length > 0) {
        const uploads = await Promise.all(
          files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `posts/${fileName}`;
            
            const { error } = await supabase.storage
              .from('post_images')
              .upload(filePath, file);
              
            if (error) throw error;
              
            const { data } = supabase.storage
              .from('post_images')
              .getPublicUrl(filePath);
              
            return data.publicUrl;
          })
        );
        
        uploadedImageUrls = [...uploadedImageUrls, ...uploads];
      }
      
      // Save the post
      await onSave({ content, images: uploadedImageUrls });
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error updating post",
        description: "An error occurred while updating your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('post.edit')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post?.author?.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {post?.author?.displayName?.[0] || post?.author?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">
                {post?.author?.displayName || post?.author?.username || 'User'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Editing post
              </p>
            </div>
          </div>
          
          <MentionInput
            value={content}
            onChange={setContent}
            className="bg-muted/30 resize-none min-h-[120px]"
          />
          
          {(images.length > 0 || files.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((imageUrl, index) => (
                <div key={`image-${index}`} className="relative group aspect-square">
                  <img 
                    src={imageUrl} 
                    alt={`Post image ${index + 1}`} 
                    className="h-full w-full object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {files.map((file, index) => (
                <div key={`file-${index}`} className="relative group aspect-square">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`New image ${index + 1}`} 
                    className="h-full w-full object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length + files.length >= 4}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {t('post.addImage')}
            </Button>
            
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleEmojiButtonClick}
                >
                  <Smile className="mr-2 h-4 w-4" />
                  {t('post.addEmoji')}
                </Button>
              </PopoverTrigger>
              {EmojiPicker && emojiData && (
                <PopoverContent className="w-auto p-0 border-none" side="top">
                  <EmojiPicker
                    data={emojiData}
                    onEmojiSelect={handleEmojiSelect}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    previewPosition="none"
                  />
                </PopoverContent>
              )}
            </Popover>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('post.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('post.saveChanges')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditor;
