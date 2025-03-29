
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Post, usePost } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import CommentSection from "./CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import SavePostButton from "./SavePostButton";
import OnlineStatus from '../OnlineStatus';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import PostActions from "./PostActions";

// Helper function to safely format dates
const safeFormatDate = (date: Date | string | null | undefined) => {
  if (!date) return "recently";
  
  try {
    // If it's a string, try to convert it to a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "recently";
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "recently";
  }
};

// Function to parse content and convert @mentions to links
const parseContent = (content: string) => {
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    
    // Add the mention as a link
    const username = match[1];
    parts.push(
      <Link 
        key={`mention-${match.index}`} 
        to={`/profile/${username}`} 
        className="text-primary font-medium hover:underline"
      >
        @{username}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : content;
};

interface PostCardProps {
  post: Post;
  onAction?: () => void | Promise<void>;
}

const PostCard: React.FC<PostCardProps> = ({ post, onAction }) => {
  const { likePost, unlikePost, commentOnPost, sharePost, deletePost } = usePost();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postUser, setPostUser] = useState<any>(null);
  
  React.useEffect(() => {
    const fetchPostUser = async () => {
      if (post.userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', post.userId)
          .single();
          
        if (!error && data) {
          setPostUser(data);
        }
      }
    };
    
    fetchPostUser();
  }, [post.userId]);
  
  const isLiked = user ? post.likes.includes(user.id) : false;
  
  const handleLikeToggle = () => {
    if (!user) {
      toast({
        title: t('common.signInRequired'),
        description: t('post.signInToLike'),
        variant: "destructive"
      });
      return;
    }
    
    if (isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
    
    if (onAction) onAction();
  };
  
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && !isSubmitting) {
      if (!user) {
        toast({
          title: t('common.signInRequired'),
          description: t('post.signInToComment'),
          variant: "destructive"
        });
        return;
      }
      
      setIsSubmitting(true);
      commentOnPost(post.id, newComment);
      setNewComment("");
      setShowComments(true);
      setIsSubmitting(false);
      if (onAction) onAction();
    }
  };
  
  const handleShare = () => {
    sharePost(post.id);
    if (onAction) onAction();
  };
  
  const handleDelete = () => {
    deletePost(post.id);
    if (onAction) onAction();
  };

  const handleShowComments = () => {
    setShowComments(!showComments);
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <Card className="overflow-hidden mb-4 border-border">
        <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-3">
            <Link to={postUser ? `/profile/${postUser.username}` : "#"}>
              <div className="relative">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={postUser?.avatar_url || "/placeholder.svg"} alt={postUser?.display_name || "User"} />
                  <AvatarFallback className="bg-muted text-foreground font-medium">
                    {postUser?.display_name ? postUser.display_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <OnlineStatus userId={post.userId} showLabel={false} />
                </div>
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={postUser ? `/profile/${postUser.username}` : "#"} className="font-medium hover:underline">
                  {postUser?.display_name || "User"}
                </Link>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>@{postUser?.username || "user"}</span>
                <span className="px-1">•</span>
                <span>{safeFormatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.id === post.userId && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>{t('post.report')}</DropdownMenuItem>
              <DropdownMenuItem>{t('post.copyLink')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="p-4">
          <p className="whitespace-pre-wrap">{parseContent(post.content)}</p>
          
          {post.images && post.images.length > 0 && (
            <div className={cn(
              "grid gap-2 mt-3 rounded-lg overflow-hidden", 
              post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {post.images.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={`Post image ${index + 1}`} 
                  className={cn(
                    "w-full h-auto object-cover rounded-lg", 
                    post.images && post.images.length === 1 && "max-h-[350px]"
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-4 pt-0 pb-4 flex flex-col">
          <PostActions
            postId={post.id}
            isLiked={isLiked}
            likeCount={post.likes.length}
            commentCount={post.comments.length}
            onLikeToggle={handleLikeToggle}
            onShowComments={handleShowComments}
            onShare={handleShare}
            onDelete={user?.id === post.userId ? handleDelete : undefined}
            isOwnPost={user?.id === post.userId}
            postTitle={post.content.substring(0, 30) + (post.content.length > 30 ? '...' : '')}
          />
          
          {showComments && (
            <>
              <Separator className="my-3" />
              <CommentSection 
                post={post} 
                newComment={newComment}
                setNewComment={setNewComment}
                handleComment={handleComment}
              />
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PostCard;
