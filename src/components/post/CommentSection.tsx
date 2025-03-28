
import React from "react";
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
  
  const handleLikeComment = (commentId: string) => {
    likeComment(post.id, commentId);
  };

  const commentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleComment} className="flex gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user?.avatar} alt={user?.displayName} />
          <AvatarFallback>
            {user?.displayName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none pr-10"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 bottom-2 h-6 w-6"
            disabled={!newComment.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <AnimatePresence>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map((comment) => {
              const commentUser = getUserById(comment.userId);
              const isLiked = user ? comment.likes.includes(user.id) : false;
              
              return (
                <motion.div 
                  key={comment.id} 
                  className="flex gap-2"
                  variants={commentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <Link to={`/profile/${comment.userId}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={commentUser?.avatar} alt={commentUser?.displayName} />
                      <AvatarFallback>
                        {commentUser?.displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <Link to={`/profile/${comment.userId}`} className="font-medium text-sm hover:underline">
                          {commentUser?.displayName}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-6 w-6", 
                          isLiked && "text-fenix-dark"
                        )}
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {comment.likes.length > 0 && comment.likes.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm italic">No comments yet. Be the first to comment!</p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;
