import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, User } from "./AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

// Post type definition
export type Post = {
  id: string;
  userId: string;
  content: string;
  images?: string[];
  createdAt: Date;
  likes: string[];
  comments: Comment[];
  shares: number;
  isShared?: boolean;
  originalPostId?: string;
  isProfessional?: boolean;
};

// Comment type
export type Comment = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  likes: string[];
};

// Context type
type PostContextType = {
  posts: Post[];
  userPosts: Post[];
  feedPosts: Post[];
  createPost: (content: string, images?: string[], isProfessional?: boolean) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  commentOnPost: (postId: string, content: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  getPostById: (postId: string) => Post | undefined;
  getUserById: (userId: string) => User | undefined;
  fetchPosts: () => Promise<void>;
};

// Sample users (we'll sync with AuthContext)
let MOCK_USERS = [
  {
    id: "1",
    username: "john_doe",
    email: "john@example.com",
    displayName: "John Doe",
    avatar: "/placeholder.svg",
    coins: 500,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    bio: "Computer Science student and tech enthusiast.",
    friends: ["2", "3"]
  },
  {
    id: "2",
    username: "jane_smith",
    email: "jane@example.com",
    displayName: "Jane Smith",
    avatar: "/placeholder.svg",
    coins: 750,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    bio: "Psychology major, love reading and coffee.",
    friends: ["1"]
  },
  {
    id: "3",
    username: "alex_johnson",
    email: "alex@example.com",
    displayName: "Alex Johnson",
    avatar: "/placeholder.svg",
    coins: 350,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    friends: ["1"]
  }
];

// Sample posts (fallback)
const INITIAL_POSTS: Post[] = [
  {
    id: "1",
    userId: "2",
    content: "Just submitted my thesis paper! After months of research and writing, it feels amazing to finally be done! #AcademicLife #GradSchool",
    createdAt: new Date(Date.now() - 3600000 * 2),
    likes: ["1", "3"],
    comments: [
      {
        id: "c1",
        userId: "1",
        content: "Congratulations! What was your thesis about?",
        createdAt: new Date(Date.now() - 3000000),
        likes: []
      }
    ],
    shares: 3,
    isProfessional: true
  },
  {
    id: "2",
    userId: "1",
    content: "Check out this cool project I've been working on for my Computer Science class. Built a mini game using React! #CodingLife #WebDev",
    images: ["/placeholder.svg"],
    createdAt: new Date(Date.now() - 3600000 * 24),
    likes: ["2"],
    comments: [],
    shares: 1
  },
  {
    id: "3",
    userId: "3",
    content: "Looking for study partners for the upcoming calculus exam. Anyone interested in forming a study group?",
    createdAt: new Date(Date.now() - 3600000 * 48),
    likes: ["2", "1"],
    comments: [
      {
        id: "c2",
        userId: "2",
        content: "I'm in! The last exam was brutal.",
        createdAt: new Date(Date.now() - 3500000),
        likes: ["3"]
      }
    ],
    shares: 0,
    isProfessional: true
  },
  {
    id: "4",
    userId: "2",
    content: "Just discovered the best coffee shop near campus. Perfect spot for studying or just hanging out between classes!",
    images: ["/placeholder.svg"],
    createdAt: new Date(Date.now() - 3600000 * 72),
    likes: [],
    comments: [],
    shares: 2
  }
];

// Create context
const PostContext = createContext<PostContextType | undefined>(undefined);

// Provider component
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const { user, addCoins } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Get user posts
  const userPosts = user 
    ? posts.filter(post => post.userId === user.id)
    : [];

  // Get feed posts (from user and friends)
  const feedPosts = user
    ? posts.filter(post => 
        post.userId === user.id || 
        user.friends.includes(post.userId)
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : [];

  // Fetch posts from database
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          images,
          user_id,
          is_professional,
          created_at,
          profiles:user_id (username, display_name, avatar_url),
          likes:likes(id, user_id),
          comments:comments(id, content, user_id, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      // Transform database posts to our format
      if (data && data.length > 0) {
        const formattedPosts: Post[] = data.map((dbPost: any) => ({
          id: dbPost.id,
          userId: dbPost.user_id,
          content: dbPost.content,
          images: dbPost.images || [],
          createdAt: safeParseDate(dbPost.created_at),
          likes: (dbPost.likes || []).map((like: any) => like.user_id),
          comments: (dbPost.comments || []).map((comment: any) => ({
            id: comment.id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: safeParseDate(comment.created_at),
            likes: []
          })),
          shares: 0, // Implement shares later
          isProfessional: dbPost.is_professional
        }));

        setPosts(formattedPosts);
      } else {
        // If no posts, keep the fallback posts
        console.log("No posts found in database, using fallback data");
      }
    } catch (error) {
      console.error("Error in fetchPosts:", error);
    }
  };

  // Create a new post
  const createPost = async (content: string, images?: string[], isProfessional?: boolean) => {
    if (!user) return;

    try {
      // Insert post into the database
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          images,
          user_id: user.id,
          is_professional: isProfessional || false
        })
        .select('id, created_at');

      if (error) {
        console.error("Error creating post:", error);
        toast({
          title: "Error creating post",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data && data[0]) {
        const newPost: Post = {
          id: data[0].id,
          userId: user.id,
          content,
          images,
          createdAt: safeParseDate(data[0].created_at),
          likes: [],
          comments: [],
          shares: 0,
          isProfessional
        };

        setPosts(prev => [newPost, ...prev]);
        
        // Reward user with coins for posting
        addCoins(10, "Post created");
        
        toast({
          title: "Post created",
          description: "Your post has been published successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error in createPost:", error);
      toast({
        title: "Error",
        description: "Failed to create post: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Like a post
  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const alreadyLiked = post.likes.includes(user.id);
      
      if (alreadyLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error("Error removing like:", error);
          return;
        }

        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: p.likes.filter(id => id !== user.id)
            };
          }
          return p;
        }));
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) {
          console.error("Error adding like:", error);
          return;
        }

        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: [...p.likes, user.id]
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Error in likePost:", error);
    }
  };

  // Comment on a post
  const commentOnPost = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        })
        .select('id, created_at');

      if (error) {
        console.error("Error adding comment:", error);
        return;
      }

      if (data && data[0]) {
        const newComment: Comment = {
          id: data[0].id,
          userId: user.id,
          content,
          createdAt: safeParseDate(data[0].created_at),
          likes: []
        };

        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment]
            };
          }
          return post;
        }));
        
        // Reward user with coins for commenting
        addCoins(2, "Comment added");
      }
    } catch (error) {
      console.error("Error in commentOnPost:", error);
    }
  };

  // Share a post
  const sharePost = async (postId: string) => {
    if (!user) return;

    const originalPost = posts.find(post => post.id === postId);
    if (!originalPost) return;

    try {
      // In a real app, this would create a new post with a reference to the original
      // For now, we'll just update the UI
      const sharedPost: Post = {
        id: `post_${Date.now()}`,
        userId: user.id,
        content: originalPost.content,
        images: originalPost.images,
        createdAt: new Date(),
        likes: [],
        comments: [],
        shares: 0,
        isShared: true,
        originalPostId: originalPost.id,
        isProfessional: originalPost.isProfessional
      };

      setPosts([sharedPost, ...posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            shares: post.shares + 1
          };
        }
        return post;
      })]);
      
      // Reward user with coins for sharing
      addCoins(5, "Post shared");
    } catch (error) {
      console.error("Error in sharePost:", error);
    }
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Could not delete post: " + error.message,
          variant: "destructive"
        });
        return;
      }

      setPosts(posts.filter(post => 
        post.id !== postId && post.originalPostId !== postId
      ));

      toast({
        title: "Post deleted",
        description: "Your post has been removed",
      });
    } catch (error) {
      console.error("Error in deletePost:", error);
    }
  };

  // Like a comment
  const likeComment = async (postId: string, commentId: string) => {
    if (!user) return;

    // For now, just updating the UI
    // In a real app, this would update the database
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const alreadyLiked = comment.likes.includes(user.id);
              
              if (alreadyLiked) {
                // Unlike
                return {
                  ...comment,
                  likes: comment.likes.filter(id => id !== user.id)
                };
              } else {
                // Like
                return {
                  ...comment,
                  likes: [...comment.likes, user.id]
                };
              }
            }
            return comment;
          })
        };
      }
      return post;
    }));
  };

  // Get post by ID
  const getPostById = (postId: string): Post | undefined => {
    return posts.find(post => post.id === postId);
  };

  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    // If the current user's ID matches, return that user
    if (user && user.id === userId) {
      return user;
    }
    
    // Otherwise look in MOCK_USERS
    return MOCK_USERS.find(user => user.id === userId);
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        userPosts,
        feedPosts,
        createPost,
        likePost,
        commentOnPost,
        sharePost,
        deletePost,
        likeComment,
        getPostById,
        getUserById,
        fetchPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

// Custom hook for using the post context
export const usePost = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};
