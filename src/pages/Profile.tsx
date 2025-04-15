import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useAuth } from '@/context/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import { Shield, Star, Award, BookMarked, Heart, Sparkles } from 'lucide-react';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { UserBadge } from '@/types/user';
import { useAchievements } from '@/context/AchievementContext';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const { earnedBadges } = useAchievements();

  // Combine achievement badges with admin badge if user is admin
  const getUserBadges = (): UserBadge[] => {
    const allBadges = [...earnedBadges];
    
    // Add admin badge if user is an admin
    if (profileUser?.isAdmin) {
      const adminBadge: UserBadge = {
        id: 'admin',
        name: 'Administrator',
        description: 'This user is a platform administrator',
        icon: 'admin',
        backgroundColor: '#FF6B4A',
        color: '#FFFFFF',
        earned: true
      };
      
      // Insert admin badge at the beginning
      allBadges.unshift(adminBadge);
    }
    
    return allBadges;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (!username) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
          
        if (error) throw error;
        
        setProfileUser(data);
        
        // Check if this is the current user's profile
        if (user && user.username === username) {
          setIsCurrentUser(true);
        }
        
        // Check if user is a friend
        if (user && user.id && data.id && user.id !== data.id) {
          const { data: friendData } = await supabase
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${user.id},friend_id.eq.${data.id}),and(friend_id.eq.${user.id},user_id.eq.${data.id})`)
            .eq('status', 'accepted');
            
          setIsFriend(friendData && friendData.length > 0);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [user, username]);

  const handleAddFriend = async () => {
    if (!user || !profileUser) return;
    
    try {
      // Send friend request
      await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: profileUser.id, status: 'pending' }
        ]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !profileUser) return;
    
    try {
      // Remove friend relationship
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profileUser.id}),and(friend_id.eq.${user.id},user_id.eq.${profileUser.id})`);
        
      setIsFriend(false);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-6">
          <Card className="mb-4">
            <div className="flex items-center space-x-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-4 md:py-6">
        {isEditingProfile ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Edit Profile Picture</h3>
              <ProfilePictureUpload />
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)} className="mt-4">
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">
            <Card className="overflow-hidden border-2 border-primary/10 profile-card">
              <div className="h-24 md:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"></div>
              <div className="px-4 pb-4 -mt-12 relative">
                <ProfileHeader 
                  user={profileUser || { id: '', username: username || '', displayName: username || '' }}
                  isCurrentUser={isCurrentUser}
                  isFriend={isFriend}
                  onAddFriend={handleAddFriend}
                  onRemoveFriend={handleRemoveFriend}
                  loading={false} 
                />
              </div>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-4 md:p-6">
            <ProfileTabs 
              username={username || ''} 
              isOwnProfile={isCurrentUser}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
