
import React, { useState } from 'react';
import { MessageSquare, Heart, Repeat, Share2, Flag, BookmarkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReportModal from '../ReportModal';

interface PostActionsProps {
  postId: string;
  likes: string[];
  comments: any[];
  onLike: () => void;
  onComment: () => void;
  onShare?: () => void;
  onAction?: () => void;
}

const PostActions = ({ 
  postId, 
  likes, 
  comments, 
  onLike, 
  onComment, 
  onShare,
  onAction
}: PostActionsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoadingSave, setIsLoadingSave] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // Check if post is saved when component mounts
  React.useEffect(() => {
    if (!user) return;
    
    const checkIfSaved = async () => {
      try {
        const { data } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsLoadingSave(false);
      }
    };
    
    checkIfSaved();
  }, [postId, user]);

  const isLiked = user ? likes.includes(user.id) : false;

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    onLike();
  };

  const handleComment = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      return;
    }

    onComment();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/post/' + postId);
    toast({
      title: "Link copied",
      description: "Post link copied to clipboard",
    });
    
    if (onShare) {
      onShare();
    }
  };
  
  const handleSavePost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save posts",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isSaved) {
        // Unsave post
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: "Post unsaved",
          description: "Post removed from your saved items",
        });
      } else {
        // Save post
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id
          });
          
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: "Post saved",
          description: "Post added to your saved items",
        });
      }
      
      if (onAction) onAction();
    } catch (error: any) {
      console.error('Error saving/unsaving post:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReportClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to report posts",
        variant: "destructive",
      });
      return;
    }
    
    setShowReportModal(true);
  };

  return (
    <>
      <div className="flex justify-between mt-2">
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center ${isLiked ? 'text-red-500' : ''}`} 
            onClick={handleLike}
          >
            <Heart className={`mr-1 h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
            {likes.length > 0 && <span>{likes.length}</span>}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center" 
            onClick={handleComment}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            {comments.length > 0 && <span>{comments.length}</span>}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center" 
            onClick={handleShare}
          >
            <Share2 className="mr-1 h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center" 
            onClick={handleReportClick}
          >
            <Flag className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center ${isSaved ? 'text-yellow-500' : ''}`} 
            onClick={handleSavePost}
            disabled={isLoadingSave || loading}
          >
            <BookmarkIcon className={`h-4 w-4 ${isSaved ? 'fill-yellow-500' : ''}`} />
          </Button>
        </div>
      </div>
      
      <ReportModal 
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        targetId={postId}
      />
    </>
  );
};

export default PostActions;
