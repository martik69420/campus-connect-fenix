
import React from "react";
import { Link } from "react-router-dom";
import { Users, MapPin, Calendar, Briefcase, Edit, UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileUser, isOwnProfile }) => {
  const { user, updateUser } = useAuth();
  
  // Check if the viewed user is a friend of the current user
  const isFriend = user?.friends.includes(profileUser.id) || false;

  const toggleFriendship = () => {
    if (!user) return;
    
    let newFriends = [...user.friends];
    
    if (isFriend) {
      // Remove from friends
      newFriends = newFriends.filter(id => id !== profileUser.id);
    } else {
      // Add to friends
      newFriends.push(profileUser.id);
    }
    
    updateUser({ friends: newFriends });
  };

  return (
    <Card className="overflow-hidden mb-6">
      <div className="h-32 bg-gradient-to-r from-fenix/30 to-fenix/10"></div>
      
      <CardContent className="pt-0">
        <div className="-mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profileUser.avatar} alt={profileUser.displayName} />
                <AvatarFallback className="text-2xl font-bold bg-fenix text-white">
                  {profileUser.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div className="pb-1">
              <h2 className="text-2xl font-bold">{profileUser.displayName}</h2>
              <p className="text-muted-foreground">@{profileUser.username}</p>
            </div>
          </div>
          
          <div className="ml-auto sm:ml-0">
            {isOwnProfile ? (
              <Button variant="outline" className="gap-1.5">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFriend ? "outline" : "default"}
                className="gap-1.5"
                onClick={toggleFriendship}
              >
                {isFriend ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfriend
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add Friend
                  </>
                )}
              </Button>
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
              <span>Joined {formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <Link to={`/profile/${profileUser.id}/friends`} className="hover:text-foreground transition-colors">
                {profileUser.friends.length} friends
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
              <div className="w-2 h-2 rounded-full bg-fenix"></div>
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
