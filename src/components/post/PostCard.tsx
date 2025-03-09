import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreHorizontal, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Post, usePost } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import CommentSection from "./CommentSection";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onAction?: () => void | Promise<void>;
}

const PostCard: React.FC<PostCardProps> = ({ post, onAction }) => {
  const { getUserById, likePost, commentOnPost, sharePost, deletePost } = usePost();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const postUser = getUserById(post.userId);
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
      <Card className="overflow-hidden mb-4 border-border">
        <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-3">
            <Link to={`/profile/${post.userId}`}>
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={postUser?.avatar} alt={postUser?.displayName} />
                <AvatarFallback className="bg-muted text-foreground font-medium">
                  {postUser?.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.userId}`} className="font-medium hover:underline">
                  {postUser?.displayName}
                </Link>
                {post.isProfessional && (
                  <Badge variant="outline" className="px-1.5 py-0 h-5 text-xs flex items-center gap-0.5 border-fenix/30 text-fenix-dark">
                    <Briefcase className="h-3 w-3" />
                    <span>Pro</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>@{postUser?.username}</span>
                <span className="px-1">•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
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
          <p className="whitespace-pre-wrap">{post.content}</p>
          
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
                    post.images!.length === 1 && "max-h-[350px]"
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-4 pt-0 pb-4 flex flex-col">
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "gap-2 font-normal", 
                isLiked && "text-fenix-dark"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span>{post.likes.length}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 font-normal"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments.length}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 font-normal"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span>{post.shares}</span>
            </Button>
          </div>
          
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
