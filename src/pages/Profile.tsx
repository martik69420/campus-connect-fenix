
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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
      if (!username) {
        setError(t('profile.profileNotFound'));
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading profile for username:', username);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();
          
        if (error) {
          console.error('Error loading profile:', error);
          setError(t('profile.failedToLoad'));
          return;
        }
        
        if (!data) {
          console.log('No profile found for username:', username);
          setError(t('profile.profileNotFound'));
          return;
        }
        
        console.log('Profile loaded successfully:', data);
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
        setError(t('profile.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [user, username, t]);

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
        <div className="container py-6 max-w-4xl mx-auto">
          <Card className="mb-6 border-2 border-primary/10 shadow-sm">
            <div className="flex items-center space-x-4 p-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-4xl mx-auto">
          <Card className="mb-6 border-2 border-destructive/20 shadow-sm">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">{t('profile.notFound')}</h2>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 md:py-8 max-w-4xl mx-auto">
        {isEditingProfile ? (
          <Card className="mb-8 border-2 border-primary/10 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">{t('profile.editProfile')}</h3>
              <ProfilePictureUpload />
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)} className="mt-6">
                {t('common.cancel')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-8">
            <Card className="overflow-hidden border-2 border-primary/10 profile-card shadow-md rounded-xl">
              <div className="h-32 md:h-40 bg-gradient-to-r from-fenix/30 via-primary/20 to-fenix/30"></div>
              <div className="px-6 pb-6 -mt-16 relative">
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

        <Card className="border shadow-sm rounded-xl">
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
