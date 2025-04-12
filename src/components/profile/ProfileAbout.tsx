
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, BookIcon, MapPinIcon } from 'lucide-react';
import { useAuth } from '@/context/auth';
import type { User } from '@/context/auth/types';

interface ProfileAboutProps {
  username?: string;
}

const ProfileAbout: React.FC<ProfileAboutProps> = ({ username }) => {
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch the user data from the API
    // For now, we'll simulate by checking if the username matches the current user
    if (username && user && user.username === username) {
      setProfileUser(user);
    } else if (username) {
      // For demo purposes, create a mock user
      setProfileUser({
        id: '123',
        username: username,
        displayName: username,
        bio: `This is the bio for ${username}. In a real application, this would be fetched from the database.`,
        school: 'Example University',
        location: 'New York, NY',
        createdAt: new Date().toISOString()
      });
    }
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profileUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">About</h3>
            <p className="text-muted-foreground mt-2">
              {profileUser.bio || `No bio available for ${profileUser.displayName || profileUser.username}.`}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {profileUser.school && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <BookIcon className="w-3.5 h-3.5" />
                <span>{profileUser.school}</span>
              </Badge>
            )}
            
            {profileUser.location && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                <span>{profileUser.location}</span>
              </Badge>
            )}
            
            {profileUser.createdAt && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>
                  Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAbout;
