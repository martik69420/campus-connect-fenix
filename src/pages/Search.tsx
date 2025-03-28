import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search as SearchIcon, User, Users, Book, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

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

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('users'); // 'users', 'posts', 'groups', 'pages'
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      let data, error;

      switch (searchType) {
        case 'users':
          ({ data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, bio, school')
            .ilike('display_name', `%${searchTerm}%`)
            .limit(10));
          break;
        // Add other cases for 'posts', 'groups', 'pages' when you have the corresponding tables
        case 'posts':
          ({ data, error } = await supabase
            .from('posts')
            .select(`
              id,
              content,
              images,
              created_at,
              user_id,
              likes:likes(id, user_id),
              comments:comments(id, content, user_id, created_at),
              profiles (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .ilike('content', `%${searchTerm}%`)
            .limit(10));
          break;
        default:
          data = [];
          error = null;
          break;
      }

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, toast]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [handleSearch, searchTerm]);

  const renderResults = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (searchResults.length === 0) {
      return <p>No results found.</p>;
    }

    switch (searchType) {
      case 'users':
        return (
          <div className="space-y-4">
            {searchResults.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.display_name} />
                      <AvatarFallback>{user.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/profile/${user.username}`} className="font-medium hover:underline">
                        {user.display_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.bio || 'No bio available'}</p>
                      <p className="text-sm text-muted-foreground">School: {user.school || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case 'posts':
        return (
          <div className="space-y-4">
            {searchResults.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {post.profiles && (
                      <Avatar>
                        <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} alt={post.profiles.display_name} />
                        <AvatarFallback>{post.profiles.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {post.profiles && (
                        <Link to={`/profile/${post.profiles.username}`} className="font-medium hover:underline">
                          {post.profiles.display_name}
                        </Link>
                      )}
                      {post.profiles && (
                        <p className="text-sm text-muted-foreground">@{post.profiles.username}</p>
                      )}
                      <p className="text-sm">{post.content}</p>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      default:
        return <p>No results to display.</p>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-1">
            <Input
              type="text"
              placeholder={`Search ${searchType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <SearchIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={searchType === 'users' ? 'default' : 'outline'}
              onClick={() => setSearchType('users')}
            >
              <User className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={searchType === 'posts' ? 'default' : 'outline'}
              onClick={() => setSearchType('posts')}
            >
              <Book className="w-4 h-4 mr-2" />
              Posts
            </Button>
            {/* Add more buttons for 'groups' and 'pages' when you have the corresponding tables */}
            <Button variant="outline" disabled>
              <Users className="w-4 h-4 mr-2" />
              Groups (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              <Globe className="w-4 h-4 mr-2" />
              Pages (Coming Soon)
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          {renderResults()}
        </div>
      </div>
    </AppLayout>
  );
};

export default Search;
