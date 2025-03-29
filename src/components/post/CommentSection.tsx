
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Heart, SendHorizontal, Reply, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePost, Post, Comment } from "@/context/PostContext";
import { useAuth } from "@/context/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";

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
  const { toast } = useToast();
  const { t } = useLanguage();
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  
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
    if (!user) {
      toast({
        title: t('common.signInRequired'),
        description: t('post.signInToLike'),
        variant: "destructive"
      });
      return;
    }
    likeComment(post.id, commentId);
  };

  const handleReplyTo = (commentId: string, username: string) => {
    if (!user) {
      toast({
        title: t('common.signInRequired'),
        description: t('post.signInToComment'),
        variant: "destructive"
      });
      return;
    }
    
    setReplyingTo(commentId);
    setReplyText(`@${username} `);
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };
  
  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      setNewComment(replyText);
      handleComment(e);
      setReplyingTo(null);
      setReplyText("");
    }
  };

  const toggleExpandComment = (commentId: string) => {
    setExpandedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId) 
        : [...prev, commentId]
    );
  };
  
  const isCommentExpanded = (commentId: string): boolean => {
    return expandedComments.includes(commentId);
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
            {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            placeholder={t('post.writeComment')}
            className="min-h-[60px] resize-none pr-10"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 bottom-2 h-6 w-6"
            disabled={!newComment.trim()}
            aria-label={t('post.submitComment')}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <AnimatePresence>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3 mt-4">
            {post.comments.map((comment) => {
              const commentUser = commentUsers[comment.userId] || getUserById(comment.userId);
              const isLiked = user ? comment.likes.includes(user.id) : false;
              const username = commentUser?.username || "user";
              const isCommentOwner = user?.id === comment.userId;
              
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
                  <Link to={`/profile/${username}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={commentUser?.avatar_url} alt={commentUser?.display_name} />
                      <AvatarFallback>
                        {commentUser?.display_name ? commentUser.display_name.split(' ').map(n => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className={cn(
                      "bg-secondary rounded-lg p-3",
                      isCommentExpanded(comment.id) ? "max-h-none" : "max-h-[150px] overflow-hidden"
                    )}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${username}`} className="font-medium text-sm hover:underline">
                            {commentUser?.display_name || "User"}
                          </Link>
                          {isCommentOwner && (
                            <Badge variant="outline" className="px-1.5 py-0 text-xs">
                              {t('post.author')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isCommentOwner && (
                                <DropdownMenuItem className="text-destructive">
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                {t('post.report')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                    
                    {comment.content.length > 300 && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs h-auto p-0 mt-1" 
                        onClick={() => toggleExpandComment(comment.id)}
                      >
                        {isCommentExpanded(comment.id) ? t('post.showLess') : t('post.showMore')}
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-3 mt-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-6 w-6", 
                          isLiked && "text-fenix-dark"
                        )}
                        onClick={() => handleLikeComment(comment.id)}
                        aria-label={t('post.likeComment')}
                      >
                        <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {comment.likes.length > 0 && comment.likes.length}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => handleReplyTo(comment.id, username)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        {t('post.reply')}
                      </Button>
                    </div>
                    
                    {replyingTo === comment.id && (
                      <motion.div 
                        className="mt-2 ml-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <form onSubmit={handleSubmitReply} className="flex gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={user?.avatar} alt={user?.displayName} />
                            <AvatarFallback>
                              {user?.displayName ? user.displayName.charAt(0) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 relative">
                            <Textarea
                              placeholder={t('post.replyToUser', { username: commentUser?.display_name || "User" })}
                              className="min-h-[40px] text-sm resize-none pr-16"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              autoFocus
                            />
                            <div className="absolute right-2 bottom-2 flex gap-1">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={handleCancelReply}
                              >
                                {t('common.cancel')}
                              </Button>
                              <Button 
                                type="submit" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={!replyText.trim()}
                              >
                                {t('post.reply')}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm italic py-4">{t('post.noComments')}</p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;
