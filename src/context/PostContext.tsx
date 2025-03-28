import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from "./AuthContext";
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the Post type
export type Post = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  likes: number;
  comments: number;
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
};

// Create the context
const PostContext = createContext<PostContextType | undefined>(undefined);

// Post Provider component
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, createdAt, userId, likes, comments,
          profiles (
            id, username, display_name, avatar_url
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedPosts = data.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        userId: post.userId,
        likes: post.likes,
        comments: post.comments,
        user: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          displayName: post.profiles.display_name,
          avatar: post.profiles.avatar_url,
          coins: 0,
          createdAt: '',
          email: '',
          school: '',
          friends: [],
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

  // Function to add a post
  const addPost = async (content: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to add a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{ content, userId: user.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Optimistically update the state
      setPosts(prevPosts => [{
        id: data.id,
        content: data.content,
        createdAt: data.createdAt,
        userId: data.userId,
        likes: 0,
        comments: 0,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          coins: 0,
          createdAt: '',
          email: '',
          school: '',
          friends: [],
        },
      }, ...prevPosts]);

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
  };

  // Function to like a post
  const likePost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to like a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );

      const { error } = await supabase
        .from('post_likes')
        .insert([{ postId, userId: user.id }]);

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
          post.id === postId ? { ...post, likes: post.likes - 1 } : post
        )
      );
    }
  };

  // Function to unlike a post
  const unlikePost = async (postId: string) => {
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
          post.id === postId ? { ...post, likes: post.likes - 1 } : post
        )
      );

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .match({ postId, userId: user.id });

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
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
    }
  };

  // Function to delete a post
  const deletePost = async (postId: string) => {
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
        .match({ id: postId, userId: user.id });

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
      await fetchPosts();
    }
  };

  return (
    <PostContext.Provider value={{ posts, addPost, likePost, unlikePost, deletePost, fetchPosts, loading }}>
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
