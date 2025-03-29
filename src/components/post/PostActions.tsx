
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { MessageSquare, Heart, Share2, Bookmark, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  onLikeToggle: () => void;
  onShowComments: () => void;
  onShare: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  isOwnPost?: boolean;
  className?: string;
}

const PostActions: React.FC<PostActionsProps> = ({
  postId,
  isLiked,
  likeCount,
  commentCount,
  onLikeToggle,
  onShowComments,
  onShare,
  onDelete,
  onReport,
  isOwnPost = false,
  className = '',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) return;
      
      try {
        setIsCheckingSaved(true);
        const { data, error } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking saved status:', error);
        }
        
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsCheckingSaved(false);
      }
    };
    
    checkIfSaved();
  }, [postId, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        title: t('auth.requiresLogin'),
        description: t('auth.loginToSave'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (isSaved) {
        // Unsave the post
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: t('post.removed'),
          description: t('post.removedFromSaved'),
        });
      } else {
        // Save the post
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId,
          });
          
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: t('post.saved'),
          description: t('post.addedToSaved'),
        });
      }
    } catch (error: any) {
      console.error('Error toggling saved status:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onLikeToggle}
        >
          <Heart
            className={`h-4 w-4 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onShowComments}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          {commentCount > 0 && <span>{commentCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4 mr-1" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground hover:text-foreground transition-colors duration-200`}
          onClick={handleSaveToggle}
          disabled={isSaving || isCheckingSaved}
        >
          <Bookmark className={`h-4 w-4 mr-1 transition-colors duration-200 ${isSaved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          {isSaved && <span className="text-yellow-400">{t('post.saved')}</span>}
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwnPost && onDelete ? (
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              {t('common.delete')}
            </DropdownMenuItem>
          ) : (
            <>
              {onReport && (
                <DropdownMenuItem onClick={onReport}>
                  {t('post.report')}
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuItem onClick={() => {
            navigator.clipboard.writeText(window.location.origin + '/post/' + postId);
            toast({
              title: t('post.linkCopied'),
              description: t('post.linkCopiedDesc'),
            });
          }}>
            {t('post.copyLink')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PostActions;
