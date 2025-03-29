
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Heart, SendHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePost, Post } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

interface CommentSectionProps {
  post: Post;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleComment: (e: React.FormEvent) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  post, 
  newComment, 
  setNewComment, 
  handleComment
}) => {
  const { getUserById, likeComment } = usePost();
  const { user } = useAuth();
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Fetch user profiles for each comment
    const fetchCommentUsers = async () => {
      if (!post.comments || post.comments.length === 0) return;
      
      const userIds = [...new Set(post.comments.map(comment => comment.userId))];
      
      if (userIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
        
      if (!error && data) {
        const usersMap = data.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
        
        setCommentUsers(usersMap);
      }
    };
    
    fetchCommentUsers();
  }, [post.comments]);
  
  const handleLikeComment = (commentId: string) => {
    likeComment(post.id, commentId);
  };

  const commentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="space-y-6 px-1">
      <form onSubmit={handleComment} className="flex gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background shadow-md">
          <AvatarImage src={user?.avatar} alt={user?.displayName} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user?.displayName ? user.displayName.substring(0, 2) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            placeholder="Write a comment..."
            className="min-h-[100px] resize-none pr-14 rounded-2xl focus-visible:ring-primary/50 text-sm shadow-lg"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-4 bottom-4 h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all"
            disabled={!newComment.trim()}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </form>
      
      <AnimatePresence>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-6 max-h-[600px] overflow-y-auto chat-scrollbar pr-2">
            {post.comments.map((comment) => {
              const commentUser = commentUsers[comment.userId] || getUserById(comment.userId);
              const isLiked = user ? comment.likes.includes(user.id) : false;
              
              return (
                <motion.div 
                  key={comment.id} 
                  className="flex gap-4"
                  variants={commentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <Link to={`/profile/${commentUser?.username || comment.userId}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow-md transition-transform hover:scale-105">
                      <AvatarImage src={commentUser?.avatar_url} alt={commentUser?.display_name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                        {commentUser?.display_name ? commentUser.display_name.substring(0, 2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-2">
                    <div className="bg-secondary/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <Link to={`/profile/${commentUser?.username || comment.userId}`} className="font-medium text-sm hover:underline text-primary">
                          {commentUser?.display_name || "User"}
                        </Link>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm break-words text-foreground/90 leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-8 w-8 rounded-full", 
                          isLiked ? "text-red-500 bg-red-500/10" : "text-muted-foreground"
                        )}
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                      </Button>
                      <span className={cn(
                        "text-xs",
                        isLiked ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {comment.likes.length > 0 && comment.likes.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-secondary/30 rounded-xl">
            <p className="text-muted-foreground text-sm italic">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;
