import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SavePostButton from '@/components/post/SavePostButton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Example data type
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastActive: Date;
}

// Sample data
const users: User[] = [
  { 
    id: 1, 
    name: "John Doe", 
    email: "john@example.com", 
    role: "Admin", 
    status: "active", 
    lastActive: new Date('2023-09-15') 
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    email: "jane@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-10-20') 
  },
  { 
    id: 3, 
    name: "Robert Johnson", 
    email: "robert@example.com", 
    role: "Editor", 
    status: "inactive", 
    lastActive: new Date('2023-08-05') 
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    email: "emily@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-11-10') 
  },
  { 
    id: 5, 
    name: "Michael Brown", 
    email: "michael@example.com", 
    role: "Moderator", 
    status: "active", 
    lastActive: new Date('2023-11-25') 
  },
  { 
    id: 6, 
    name: "Sarah Wilson", 
    email: "sarah@example.com", 
    role: "User", 
    status: "inactive", 
    lastActive: new Date('2023-07-30') 
  },
  { 
    id: 7, 
    name: "David Miller", 
    email: "david@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-11-28') 
  },
  { 
    id: 8, 
    name: "Jennifer Garcia", 
    email: "jennifer@example.com", 
    role: "Editor", 
    status: "active", 
    lastActive: new Date('2023-10-15') 
  },
  { 
    id: 9, 
    name: "James Rodriguez", 
    email: "james@example.com", 
    role: "User", 
    status: "inactive", 
    lastActive: new Date('2023-06-20') 
  },
  { 
    id: 10, 
    name: "Patricia Martinez", 
    email: "patricia@example.com", 
    role: "Admin", 
    status: "active", 
    lastActive: new Date('2023-11-01') 
  },
  { 
    id: 11, 
    name: "Thomas Anderson", 
    email: "thomas@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-10-10') 
  },
  { 
    id: 12, 
    name: "Linda Jackson", 
    email: "linda@example.com", 
    role: "Moderator", 
    status: "active", 
    lastActive: new Date('2023-09-22') 
  }
];

// Interface for saved posts
interface SavedPost {
  id: string;
  post_id: string;
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      display_name: string;
    }
  }
}

const TableDemo = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  
  // Define columns for users table
  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Last Active',
      accessorKey: 'lastActive',
      cell: (user) => user.lastActive.toLocaleDateString(),
      sortable: true,
    },
  ];

  // Define columns for saved posts with fixed TypeScript typing
  const savedPostsColumns: Column<SavedPost>[] = [
    {
      header: 'Post ID',
      accessorKey: 'post_id',
      cell: (post) => <span className="font-mono text-xs">{post.post_id.substring(0, 8)}...</span>,
    },
    {
      header: 'Content',
      // Use a function for nested property access instead of a string key
      accessorKey: 'post' as keyof SavedPost,
      cell: (post) => (
        <div className="max-w-md truncate">
          {post.post?.content}
        </div>
      ),
    },
    {
      header: 'Author',
      // Use a function for nested property access
      accessorKey: 'post' as keyof SavedPost,
      cell: (post) => post.post?.profiles?.display_name || 'Unknown',
    },
    {
      header: 'Posted',
      // Use a function for nested property access
      accessorKey: 'post' as keyof SavedPost,
      cell: (post) => {
        try {
          return formatDistanceToNow(new Date(post.post?.created_at), { addSuffix: true });
        } catch (error) {
          return 'Unknown';
        }
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (post) => (
        <div className="flex space-x-2">
          <SavePostButton postId={post.post_id} showText={true} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    
    try {
      setLoadingSavedPosts(true);
      
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          post_id,
          post:posts(
            id,
            content,
            created_at,
            user_id,
            profiles:profiles(
              username,
              display_name
            )
          )
        `)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      setSavedPosts(data || []);
      
    } catch (error: any) {
      console.error('Error fetching saved posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved posts',
        variant: 'destructive',
      });
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Data Table Example</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Users Sample Table</h2>
          <DataTable 
            data={users} 
            columns={columns} 
            searchable 
            searchField="name"
            pagination 
            pageSize={5}
          />
        </div>
        
        {user && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Saved Posts</h2>
              <button 
                onClick={fetchSavedPosts}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>
            
            {loadingSavedPosts ? (
              <div className="py-8 text-center">Loading saved posts...</div>
            ) : savedPosts.length > 0 ? (
              <DataTable 
                data={savedPosts} 
                columns={savedPostsColumns} 
                searchable 
                searchField="post.content" // This will need to be handled specially
                pagination 
                pageSize={5}
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>You haven't saved any posts yet.</p>
                <p className="mt-2 text-sm">
                  Navigate to the home page and use the bookmark button to save posts.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TableDemo;
