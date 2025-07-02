
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ExternalLink, Crown, Flag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/auth';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import ReportModal from '@/components/ReportModal';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/context/PostContext';
import { motion } from 'framer-motion';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { likePost, unlikePost, deletePost, commentOnPost } = usePost();
  const { user } = useAuth();
  const { toast } = useToast();

  const isLiked = user ? post.likes.includes(user.id) : false;
  const isOwnPost = user ? post.userId === user.id : false;

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post.id);
        toast({
          title: "Post deleted",
          description: "Your post has been deleted successfully.",
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      await commentOnPost(post.id, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPostUrl = () => {
    return `${window.location.origin}/post/${post.id}`;
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {post.images.map((imageUrl, index) => {
          // For now, we'll default to preview mode since we don't have display type stored
          // In a real implementation, you'd store the display type with each image
          const isPreview = true; // This would come from your image data structure
          
          if (isPreview) {
            return (
              <div key={index} className="rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageUrl} 
                  alt={`Post image ${index + 1}`}
                  className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              </div>
            );
          } else {
            return (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {imageUrl}
                </a>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="mb-4 shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage 
                  src={post.user?.avatar || '/placeholder.svg'} 
                  alt={post.user?.displayName || 'User'} 
                />
                <AvatarFallback className="text-sm bg-primary/10">
                  {post.user?.displayName?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm hover:underline cursor-pointer">
                    {post.user?.displayName || 'Unknown User'}
                  </p>
                  {post.user?.isAdmin && (
                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>@{post.user?.username || 'unknown'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost ? (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Delete Post
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
            
            {renderImages()}
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
                    isLiked ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{post.likes.length}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{post.comments.length}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 hover:text-green-500 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">{post.shares || 0}</span>
                </Button>
              </div>
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-yellow-500 transition-colors"
                >
                  <motion.div
                    whileTap={{ 
                      scale: 1.3,
                      rotate: [0, -15, 15, 0]
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      whileTap: { duration: 0.15 },
                      animate: { duration: 0.4, delay: 0.1 }
                    }}
                  >
                    <motion.svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      className="transition-colors"
                      whileTap={{ fill: "#eab308", stroke: "#eab308" }}
                    >
                      <path
                        d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11.5a0.5 0.5 0 0 1-0.8 0.4L8 11.333 3.8 13.9A0.5 0.5 0 0 1 3 13.5V2z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </motion.svg>
                  </motion.div>
                </Button>
              </motion.div>
            </div>
            
            {showComments && (
              <>
                <Separator className="my-4" />
                <CommentSection 
                  post={post}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleComment={handleComment}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        postId={post.id}
        postTitle={post.content}
      />

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        targetId={post.id}
        targetName={post.user?.displayName}
      />
    </>
  );
};

export default PostCard;
