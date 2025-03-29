
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar, Briefcase, Edit, UserPlus, UserMinus, Loader2, MessageCircle, MoreHorizontal, ShieldAlert, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import OnlineStatus from "@/components/OnlineStatus";
import type { User } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  user: User;
  isCurrentUser: boolean;
  isFriend: boolean;
  onAddFriend: () => void;
  onRemoveFriend: () => void;
  loading: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isCurrentUser,
  isFriend,
  onAddFriend,
  onRemoveFriend,
  loading,
}) => {
  const { t } = useLanguage();
  const { user: loggedInUser } = useAuth();
  const navigate = useNavigate();
  const [showFullBio, setShowFullBio] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleBio = () => {
    setShowFullBio(!showFullBio);
  };

  const bioDisplay = user?.bio
    ? showFullBio
      ? user.bio
      : user.bio.substring(0, 150)
    : t('profile.noBio');

  const showReadMore = user?.bio && user.bio.length > 150;

  const handleReportProfile = () => {
    console.log('Report profile clicked');
    setIsDropdownOpen(false);
  };

  const handleBlockProfile = () => {
    console.log('Block profile clicked');
    setIsDropdownOpen(false);
  };

  const handleMessage = () => {
    // Navigate to messages with this user preselected
    if (user && user.id) {
      navigate(`/messages?user=${user.id}`);
    } else {
      navigate('/messages');
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cover image/gradient banner */}
      <div className="h-36 md:h-48 w-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/60 dark:from-primary/20 dark:to-primary/50 rounded-t-xl"></div>
      
      {/* Main profile section */}
      <div className="relative bg-card dark:bg-card/95 shadow-xl rounded-b-xl px-4 md:px-8 pb-6">
        {/* Avatar positioned to overlap the cover image and card */}
        <div className="-mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-md">
            <AvatarImage src={user?.avatar || '/placeholder.svg'} alt={user?.displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col md:flex-row w-full justify-between md:items-end gap-4 pt-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user?.displayName || user?.username}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span>@{user?.username}</span>
                {user?.id && <OnlineStatus userId={user.id} className="ml-2" />}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isCurrentUser && (
                <>
                  {isFriend ? (
                    <Button variant="outline" onClick={onRemoveFriend} disabled={loading} className="shadow-sm">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('profile.removing')}
                        </>
                      ) : (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          {t('profile.removeFriend')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={onAddFriend} disabled={loading} className="shadow-sm">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('profile.adding')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t('profile.addFriend')}
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleMessage} className="shadow-sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('profile.message')}
                  </Button>
                </>
              )}

              {isCurrentUser && (
                <Button variant="secondary" onClick={() => navigate('/settings')} className="shadow-sm">
                  <Edit className="mr-2 h-4 w-4" />
                  {t('profile.editProfile')}
                </Button>
              )}

              {/* Dropdown Menu */}
              {!isCurrentUser && (
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem onClick={handleReportProfile}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      {t('profile.reportProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlockProfile}>
                      <UserX className="mr-2 h-4 w-4" />
                      {t('profile.blockProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        {t('profile.privacySettings')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* User info badges */}
        <div className="flex flex-wrap gap-3 mt-6">
          {user?.school && (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{user.school}</span>
            </Badge>
          )}
          
          {user?.location && (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location}</span>
            </Badge>
          )}
          
          {user?.createdAt && (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {t('profile.joined')} {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </span>
            </Badge>
          )}
        </div>

        {/* User Bio */}
        {user?.bio && (
          <div className="mt-6 bg-background/50 dark:bg-background/10 rounded-lg p-4 border border-border/50">
            <h3 className="text-lg font-medium mb-2">{t('profile.aboutMe')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {bioDisplay}
              {showReadMore && (
                <button onClick={toggleBio} className="text-primary ml-1 font-medium hover:underline">
                  {showFullBio ? t('profile.readLess') : t('profile.readMore')}
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
