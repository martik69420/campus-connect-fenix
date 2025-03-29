
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
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
  const { likePost, commentOnPost, sharePost, deletePost } = usePost();
  const { user } = useAuth();
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
  
  const handleLike = () => {
    likePost(post.id);
    if (onAction) onAction();
  };
  
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && !isSubmitting) {
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
      <Card className="overflow-hidden mb-4 border-border shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-3">
            <Link to={postUser ? `/profile/${postUser.username}` : "#"}>
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={postUser?.avatar_url || "/placeholder.svg"} alt={postUser?.display_name || "User"} />
                <AvatarFallback className="bg-muted text-foreground font-medium">
                  {postUser?.display_name ? postUser.display_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                </AvatarFallback>
              </Avatar>
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
                  Delete post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>Report post</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
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
                  onError={(e) => {
                    console.error(`Failed to load image: ${img}`);
                    e.currentTarget.src = '/placeholder.svg';
                  }}
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
          <div className="flex items-center justify-between w-full mb-2 bg-secondary/30 rounded-full px-2 py-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "gap-2 font-normal rounded-full transition-colors", 
                isLiked ? "text-fenix-dark hover:bg-fenix-dark/10" : "hover:bg-secondary"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current text-fenix-dark")} />
              <span>{post.likes.length}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 font-normal rounded-full transition-colors hover:bg-secondary"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments.length}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 font-normal rounded-full transition-colors hover:bg-secondary"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span>{post.shares}</span>
            </Button>
            
            <SavePostButton postId={post.id} />
          </div>
          
          {showComments && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Separator className="my-3" />
                <CommentSection 
                  post={post} 
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleComment={handleComment}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PostCard;
