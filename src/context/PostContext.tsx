
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, User } from "./AuthContext";
import { toast } from "@/hooks/use-toast";

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
  createPost: (content: string, images?: string[], isProfessional?: boolean) => void;
  likePost: (postId: string) => void;
  commentOnPost: (postId: string, content: string) => void;
  sharePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  getPostById: (postId: string) => Post | undefined;
  getUserById: (userId: string) => User | undefined;
};

// Sample users (we'll sync with AuthContext)
let MOCK_USERS = [
  {
    id: "1",
    username: "john_doe",
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
    displayName: "Alex Johnson",
    avatar: "/placeholder.svg",
    coins: 350,
    inviteCode: "test",
    createdAt: new Date(),
    school: "Example University",
    friends: ["1"]
  }
];

// Sample posts
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

  // Create a new post
  const createPost = (content: string, images?: string[], isProfessional?: boolean) => {
    if (!user) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: user.id,
      content,
      images,
      createdAt: new Date(),
      likes: [],
      comments: [],
      shares: 0,
      isProfessional
    };

    setPosts([newPost, ...posts]);
    
    // Reward user with coins for posting
    addCoins(10, "Post created");
  };

  // Like a post
  const likePost = (postId: string) => {
    if (!user) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        // Check if user already liked the post
        const alreadyLiked = post.likes.includes(user.id);
        
        if (alreadyLiked) {
          // Unlike
          return {
            ...post,
            likes: post.likes.filter(id => id !== user.id)
          };
        } else {
          // Like
          return {
            ...post,
            likes: [...post.likes, user.id]
          };
        }
      }
      return post;
    }));
  };

  // Comment on a post
  const commentOnPost = (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId: user.id,
      content,
      createdAt: new Date(),
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
  };

  // Share a post
  const sharePost = (postId: string) => {
    if (!user) return;

    const originalPost = posts.find(post => post.id === postId);
    if (!originalPost) return;

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
  };

  // Delete a post
  const deletePost = (postId: string) => {
    if (!user) return;

    setPosts(posts.filter(post => 
      post.id !== postId && post.originalPostId !== postId
    ));
  };

  // Like a comment
  const likeComment = (postId: string, commentId: string) => {
    if (!user) return;

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
