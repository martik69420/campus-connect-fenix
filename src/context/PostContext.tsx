import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from "./auth/types";
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the Comment type
export type Comment = {
  id: string;
  content: string;
  createdAt: string; // Changed from Date to string
  userId: string;
  likes: string[]; // array of user IDs who liked this comment
};

// Define the Post type
export type Post = {
  id: string;
  content: string;
  createdAt: string; // Changed from Date to string
  userId: string;
  likes: string[]; // array of user IDs who liked the post
  comments: Comment[];
  shares: number;
  images?: string[];
  user?: User;
};

// Define the context type
type PostContextType = {
  posts: Post[];
  addPost: (content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
  loading: boolean;
  // Add missing methods needed by components
  createPost: (content: string, images?: string[]) => Promise<void>;
  commentOnPost: (postId: string, content: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
};

// Create the context
const PostContext = createContext<PostContextType | undefined>(undefined);

// Post Provider component
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to fetch user information by ID
  const getUserById = useCallback((userId: string): User | undefined => {
    if (userCache[userId]) {
      return userCache[userId];
    }
    
    // Return the post's embedded user if available
    const postWithUser = posts.find(post => post.userId === userId && post.user);
    return postWithUser?.user;
  }, [userCache, posts]);

  // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, images,
          likes:likes(id, user_id),
          comments:comments(id, content, user_id, created_at),
          profiles:profiles(id, username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedPosts: Post[] = data.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        userId: post.user_id,
        likes: post.likes?.map(like => like.user_id || '') || [],
        comments: (post.comments || []).map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          userId: comment.user_id,
          likes: []
        })),
        shares: 0,
        images: post.images || [],
        user: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          displayName: post.profiles.display_name,
          avatar: post.profiles.avatar_url || '/placeholder.svg',
          coins: 0,
          createdAt: new Date().toISOString(), // Converted to string
          email: '',
          school: '',
        } : undefined,
      }));

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error("Error fetching posts:", error.message);
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Function to add a post (alias for createPost)
  const addPost = useCallback(async (content: string) => {
    await createPost(content);
  }, []);

  // Function to create a post with optional images
  const createPost = useCallback(async (content: string, images?: string[]) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to add a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      const postData = { 
        content, 
        user_id: user.id,
        images: images || null
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Optimistically update the state
      const newPost: Post = {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        userId: data.user_id,
        likes: [],
        comments: [],
        shares: 0,
        images: data.images || [],
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar || '/placeholder.svg',
          coins: user.coins,
          email: user.email,
          school: user.school,
          createdAt: user.createdAt || new Date().toISOString(),
        },
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);

      toast({
        title: "Post added",
        description: "Your post has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding post:", error.message);
      toast({
        title: "Error adding post",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Function to like a post
  const likePost = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to like a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the user already liked the post
      const post = posts.find(p => p.id === postId);
      if (post && post.likes.includes(user.id)) {
        return; // User already liked this post
      }

      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: [...post.likes, user.id] } : post
        )
      );

      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error liking post:", error.message);
      toast({
        title: "Error liking post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: post.likes.filter(id => id !== user.id) } : post
        )
      );
    }
  }, [user, posts, toast]);

  // Function to unlike a post
  const unlikePost = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to unlike a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: post.likes.filter(id => id !== user.id) } : post
        )
      );

      const { error } = await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: user.id });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error unliking post:", error.message);
      toast({
        title: "Error unliking post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: [...post.likes, user.id] } : post
        )
      );
    }
  }, [user, toast]);

  // Function to comment on a post
  const commentOnPost = useCallback(async (postId: string, content: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to comment on a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: user.id, content }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const newComment: Comment = {
              id: data.id,
              content: data.content,
              createdAt: data.created_at,
              userId: data.user_id,
              likes: []
            };
            return { 
              ...post, 
              comments: [...post.comments, newComment] 
            };
          }
          return post;
        })
      );

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error.message);
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Function to like a comment
  const likeComment = useCallback(async (postId: string, commentId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to like a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the post and comment
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId) {
                  // Toggle like
                  const isLiked = comment.likes.includes(user.id);
                  return {
                    ...comment,
                    likes: isLiked 
                      ? comment.likes.filter(id => id !== user.id) 
                      : [...comment.likes, user.id]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      );

      // In a real implementation, this would update the database
      // For now, we'll just handle it optimistically in the UI
      toast({
        title: "Comment liked",
        description: "Comment like status updated.",
      });
    } catch (error: any) {
      console.error("Error liking comment:", error.message);
      toast({
        title: "Error updating comment like",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Function to share a post
  const sharePost = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to share a post.",
        variant: "destructive",
      });
      return;
    }

    // Optimistically update share count
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    );

    toast({
      title: "Post shared",
      description: "Post has been shared successfully.",
    });
  }, [user, toast]);

  // Function to delete a post
  const deletePost = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to delete a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update the state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ id: postId, user_id: user.id });

      if (error) {
        throw error;
      }

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting post:", error.message);
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      fetchPosts();
    }
  }, [user, fetchPosts, toast]);

  return (
    <PostContext.Provider value={{ 
      posts, 
      addPost, 
      likePost, 
      unlikePost, 
      deletePost, 
      fetchPosts, 
      loading,
      createPost,
      commentOnPost,
      likeComment,
      sharePost,
      getUserById
    }}>
      {children}
    </PostContext.Provider>
  );
};

// Custom hook to use the post context
export const usePost = (): PostContextType => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};
