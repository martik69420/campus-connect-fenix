
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { MessageSquare, Heart, Share2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SavePostButton from './SavePostButton';

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

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground hover:text-foreground ${isLiked ? 'text-red-500' : ''}`}
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
      </div>
      
      <div className="flex items-center">
        <SavePostButton postId={postId} showText={false} />
        
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
    </div>
  );
};

export default PostActions;
