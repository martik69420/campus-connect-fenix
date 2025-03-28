
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar, Briefcase, Edit, UserPlus, UserMinus, Loader2, MessageCircle, MoreHorizontal, ShieldAlert, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Profile } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReportModal from "../ReportModal";

export interface ProfileHeaderProps {
  profileUser: Profile;
  isOwnProfile: boolean;
  friendStatus?: 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';
  onFriendAction?: () => void;
  loadingFriendAction?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profileUser, 
  isOwnProfile,
  friendStatus = 'not_friend',
  onFriendAction,
  loadingFriendAction = false
}) => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(profileUser.bio || "");
  const [editedDisplayName, setEditedDisplayName] = useState(profileUser.display_name || "");
  const [editedSchool, setEditedSchool] = useState(profileUser.school || "");
  const [friendCount, setFriendCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lastActive, setLastActive] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Fetch online status and last active time
    const fetchOnlineStatus = async () => {
      if (profileUser && profileUser.id) {
        const { data, error } = await supabase
          .from('user_status')
          .select('is_online, last_active')
          .eq('user_id', profileUser.id)
          .single();
          
        if (!error && data) {
          // Check if last_active is recent (within last 3 minutes)
          const lastActiveDate = new Date(data.last_active);
          const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
          
          // Only show as online if both flag is true AND last_active is recent
          setIsUserOnline(data.is_online && lastActiveDate > threeMinutesAgo);
          setLastActive(data.last_active ? new Date(data.last_active) : null);
        }
      }
    };
    
    fetchOnlineStatus();
    
    // Setup real-time subscriptions for online status changes
    const statusChannel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
          filter: `user_id=eq.${profileUser.id}`
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as { is_online: boolean; last_active: string };
            const lastActiveDate = new Date(newData.last_active);
            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
            
            setIsUserOnline(newData.is_online && lastActiveDate > threeMinutesAgo);
            setLastActive(newData.last_active ? new Date(newData.last_active) : null);
          }
        }
      )
      .subscribe();
    
    // Set up a refresh interval to periodically check if user is still active
    const refreshInterval = setInterval(() => {
      fetchOnlineStatus();
    }, 60000); // Check every minute
    
    // Fetch friend count
    const fetchFriendCount = async () => {
      if (profileUser && profileUser.id) {
        const { data, error } = await supabase
          .from('friends')
          .select('id')
          .eq('status', 'friends')
          .or(`user_id.eq.${profileUser.id},friend_id.eq.${profileUser.id}`);
          
        if (!error && data) {
          setFriendCount(data.length);
        }
      }
    };
    
    fetchFriendCount();
    
    // Set our own online status when viewing profiles
    const updateMyOnlineStatus = async () => {
      if (user && user.id) {
        const { error } = await supabase
          .from('user_status')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_active: new Date().toISOString()
          }, { onConflict: 'user_id' });
          
        if (error) console.error('Error updating online status:', error);
      }
    };
    
    updateMyOnlineStatus();
    
    // Set up interval to update last_active
    const interval = setInterval(updateMyOnlineStatus, 2 * 60 * 1000);
    
    return () => {
      supabase.removeChannel(statusChannel);
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [profileUser.id, user?.id]);
  
  const getFriendButtonText = () => {
    switch (friendStatus) {
      case 'not_friend': return t('profile.addFriend');
      case 'pending_sent': return t('profile.cancelRequest');
      case 'pending_received': return t('profile.acceptRequest');
      case 'friends': return t('profile.unfriend');
      default: return t('profile.addFriend');
    }
  };
  
  const getFriendButtonIcon = () => {
    if (loadingFriendAction) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (friendStatus) {
      case 'not_friend': return <UserPlus className="h-4 w-4" />;
      case 'pending_sent': return <UserMinus className="h-4 w-4" />;
      case 'pending_received': return <UserPlus className="h-4 w-4" />;
      case 'friends': return <UserMinus className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };
  
  const getFriendButtonVariant = () => {
    switch (friendStatus) {
      case 'friends': return 'destructive';
      case 'pending_received': return 'default';
      default: return 'outline';
    }
  };

  const handleMessageClick = () => {
    if (profileUser && profileUser.id) {
      navigate(`/messages?userId=${profileUser.id}`);
    }
  };
  
  const handleEditProfile = () => {
    setIsEditing(true);
    // Initialize with current values
    setEditedBio(profileUser.bio || "");
    setEditedDisplayName(profileUser.display_name || "");
    setEditedSchool(profileUser.school || "");
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Use auth context method to update profile
      if (updateUserProfile) {
        await updateUserProfile({
          displayName: editedDisplayName,
          bio: editedBio,
          school: editedSchool
        });
      } else {
        // Fallback direct update if context method not available
        const { error } = await supabase
          .from('profiles')
          .update({ 
            display_name: editedDisplayName,
            bio: editedBio,
            school: editedSchool
          })
          .eq('id', user.id);
          
        if (error) throw error;
      }
      
      setIsEditing(false);
      
      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.profileUpdatedDesc'),
      });
      
      // Update local state to reflect changes immediately
      profileUser.bio = editedBio;
      profileUser.display_name = editedDisplayName;
      profileUser.school = editedSchool;
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: t('profile.updateError'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setEditedBio(profileUser.bio || "");
    setEditedDisplayName(profileUser.display_name || "");
    setEditedSchool(profileUser.school || "");
  };
  
  const handleReport = () => {
    setShowReportModal(true);
  };
  
  const handleBlock = async () => {
    if (!user || !profileUser) return;
    
    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          user_id: user.id,
          blocked_user_id: profileUser.id
        });
        
      if (error) throw error;
      
      toast({
        title: t('profile.userBlocked'),
        description: t('profile.userBlockedDesc', { name: profileUser.display_name }),
      });
      
      // Navigate away from the profile
      navigate('/');
    } catch (error: any) {
      toast({
        title: t('profile.blockError'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-primary/30 to-primary/10"></div>
        
        <CardContent className="pt-0">
          <div className="-mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={profileUser.avatar_url || "/placeholder.svg"} alt={profileUser.display_name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {profileUser.display_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <OnlineStatus 
                  userId={profileUser.id} 
                  className="absolute bottom-0 right-0" 
                />
              </motion.div>
              
              <div className="pb-1">
                {isEditing ? (
                  <input
                    type="text"
                    className="text-2xl font-bold w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedDisplayName}
                    onChange={(e) => setEditedDisplayName(e.target.value)}
                    placeholder={t('profile.displayName')}
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{profileUser.display_name}</h2>
                )}
                <p className="text-muted-foreground">@{profileUser.username}</p>
              </div>
            </div>
            
            <div className="ml-auto sm:ml-0 flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {t('profile.saveChanges')}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="gap-1.5" onClick={handleEditProfile}>
                      <Edit className="h-4 w-4" />
                      {t('profile.editProfile')}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {friendStatus === 'friends' && (
                    <Button 
                      variant="outline" 
                      className="gap-1.5"
                      onClick={handleMessageClick}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t('messages.message')}
                    </Button>
                  )}
                  <Button
                    variant={getFriendButtonVariant()}
                    className="gap-1.5"
                    onClick={onFriendAction}
                    disabled={loadingFriendAction}
                  >
                    {getFriendButtonIcon()}
                    {getFriendButtonText()}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            {isEditing ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t('profile.bio')}</label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder={t('profile.bioPlaceholder')}
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t('profile.school')}</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedSchool}
                    onChange={(e) => setEditedSchool(e.target.value)}
                    placeholder={t('profile.schoolPlaceholder')}
                  />
                </div>
              </>
            ) : (
              profileUser.bio && (
                <p className="text-sm mb-4">{profileUser.bio}</p>
              )
            )}
            
            {!isEditing && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>Student at {profileUser.school}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Campus</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(profileUser.created_at), { addSuffix: true })}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <Link to={`/profile/${profileUser.username}/friends`} className="hover:text-foreground transition-colors">
                    {friendCount} {t('settings.friends')}
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-semibold">{profileUser.coins}</div>
                <div className="text-xs text-muted-foreground">{t('leaderboard.coins')}</div>
              </div>
              
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1.5 h-auto py-1 ${isUserOnline ? 'border-green-500' : 'border-gray-300'}`}
              >
                <div className={`w-2 h-2 rounded-full ${isUserOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>
                  {isUserOnline 
                    ? t('profile.online') 
                    : lastActive 
                      ? `${t('profile.lastSeen')} ${formatDistanceToNow(lastActive, { addSuffix: true })}` 
                      : t('profile.offline')}
                </span>
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <MoreHorizontal className="h-4 w-4" />
                    {t('common.more')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isOwnProfile && (
                    <>
                      <DropdownMenuItem onClick={handleReport}>
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        {t('messages.reportUser')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlock}>
                        <UserX className="h-4 w-4 mr-2" />
                        {t('profile.blockUser')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: t('profile.linkCopied'),
                      description: t('profile.linkCopiedDesc'),
                    });
                  }}>
                    {t('profile.copyProfileLink')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Modal */}
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="user"
        targetId={profileUser.id}
        targetName={profileUser.display_name}
      />
    </>
  );
};

export default ProfileHeader;
