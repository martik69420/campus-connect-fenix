
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar, Briefcase, Edit, UserPlus, UserMinus, Loader2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Profile } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const getFriendButtonText = () => {
    switch (friendStatus) {
      case 'not_friend': return 'Add Friend';
      case 'pending_sent': return 'Cancel Request';
      case 'pending_received': return 'Accept Request';
      case 'friends': return 'Unfriend';
      default: return 'Add Friend';
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
    navigate(`/messages?userId=${profileUser.id}`);
  };

  return (
    <Card className="overflow-hidden mb-6">
      <div className="h-32 bg-gradient-to-r from-primary/30 to-primary/10"></div>
      
      <CardContent className="pt-0">
        <div className="-mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profileUser.avatar_url || "/placeholder.svg"} alt={profileUser.display_name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {profileUser.display_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div className="pb-1">
              <h2 className="text-2xl font-bold">{profileUser.display_name}</h2>
              <p className="text-muted-foreground">@{profileUser.username}</p>
            </div>
          </div>
          
          <div className="ml-auto sm:ml-0 flex gap-2 flex-wrap">
            {isOwnProfile ? (
              <Button variant="outline" className="gap-1.5">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="gap-1.5"
                  onClick={handleMessageClick}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
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
          {profileUser.bio && (
            <p className="text-sm mb-4">{profileUser.bio}</p>
          )}
          
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
                0 friends
              </Link>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-semibold">{profileUser.coins}</div>
              <div className="text-xs text-muted-foreground">Coins</div>
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1.5 h-auto py-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Online</span>
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
