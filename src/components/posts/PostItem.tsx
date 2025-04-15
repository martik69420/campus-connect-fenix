
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostItemProps {
  post: {
    id: string;
    content: string;
    createdAt: string;
    user?: {
      username: string;
      displayName?: string;
      avatar?: string;
    };
    likes: any[];
    comments: any[];
    images?: string[];
  };
  showControls?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({ post, showControls = true }) => {
  const { content, createdAt, user, likes = [], comments = [], images = [] } = post;
  
  const formattedDate = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || '/placeholder.svg'} alt={user?.displayName || user?.username || 'User'} />
            <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{user?.displayName || user?.username}</p>
                <p className="text-sm text-muted-foreground">@{user?.username} · {formattedDate}</p>
              </div>
              {showControls && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-2">
              <p className="whitespace-pre-wrap">{content}</p>
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {images.map((image, index) => (
                    <img 
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="rounded-md max-h-96 w-full object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="px-4 py-3 border-t flex justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageSquare className="h-4 w-4 mr-1" />
            {comments.length > 0 ? comments.length : ''}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Heart className="h-4 w-4 mr-1" />
            {likes.length > 0 ? likes.length : ''}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="h-4 w-4 mr-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PostItem;
