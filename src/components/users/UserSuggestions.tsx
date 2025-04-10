
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const UserSuggestions: React.FC = () => {
  // Mock data - in a real app this would come from an API or context
  const suggestedUsers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      avatar: 'https://i.pravatar.cc/150?img=1',
      school: 'University of Technology',
    },
    {
      id: '2',
      name: 'Michael Chen',
      username: 'mikechen',
      avatar: 'https://i.pravatar.cc/150?img=3',
      school: 'State University',
    },
    {
      id: '3',
      name: 'Priya Patel',
      username: 'priyap',
      avatar: 'https://i.pravatar.cc/150?img=5',
      school: 'University of Technology',
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Suggested For You</h2>
        </div>
      </div>
      
      <div className="space-y-4">
        {suggestedUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Follow
            </Button>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" className="w-full">
          See More
        </Button>
      </div>
    </>
  );
};

export default UserSuggestions;
