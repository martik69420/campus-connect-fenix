
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePost } from '@/context/PostContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, AtSign } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MentionInput from '@/components/common/MentionInput';
import { supabase } from '@/integrations/supabase/client';

const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = usePost();
  const { toast } = useToast();
  const { user } = useAuth();

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
      // Find all mentioned users
      const mentionedUserIds = await processMentions(content);
      
      // Create post and get the post data with ID
      const postData = await createPost(content);
      const postId = postData?.id;
      
      // Send notifications to mentioned users
      if (mentionedUserIds.length > 0 && user) {
        for (const userId of mentionedUserIds) {
          if (userId !== user.id) { // Don't notify yourself
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'mention',
              content: `${user.displayName || user.username} mentioned you in a post`,
              related_id: postId,
              is_read: false
            });
          }
        }
      }
      
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

  const handleAddMention = () => {
    setContent(prev => {
      // Insert @ at cursor position or at the end
      const textArea = document.querySelector('textarea');
      if (textArea) {
        const cursorPos = textArea.selectionStart;
        return prev.substring(0, cursorPos) + '@' + prev.substring(textArea.selectionEnd);
      }
      return prev + '@';
    });
    
    // Focus the textarea and move cursor after the @
    setTimeout(() => {
      const textArea = document.querySelector('textarea');
      if (textArea) {
        textArea.focus();
        const cursorPos = textArea.value.lastIndexOf('@') + 1;
        textArea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar} alt={user?.displayName || "User"} />
          <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder="What's on your mind? Use @ to mention friends"
            className="min-h-[80px] resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handleAddMention}>
                <AtSign className="h-4 w-4 mr-2" />
                Mention
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
            
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
