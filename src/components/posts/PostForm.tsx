
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePost } from '@/context/PostContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = usePost();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Can't create empty post",
        description: "Please write something first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createPost(content);
      setContent('');
      toast({
        title: "Post created!",
        description: "Your post has been published.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar} alt={user?.displayName || "User"} />
          <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          
          <div className="flex justify-between items-center">
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Image
            </Button>
            
            <Button type="submit" disabled={isSubmitting || content.trim() === ''}>
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
  );
};

export default PostForm;
