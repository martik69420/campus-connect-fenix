import React, { useState, useEffect } from "react";
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
    // Implement report profile logic here
    console.log('Report profile clicked');
    setIsDropdownOpen(false);
  };

  const handleBlockProfile = () => {
    // Implement block profile logic here
    console.log('Block profile clicked');
    setIsDropdownOpen(false);
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatar and Online Status */}
      <div className="absolute top-4 right-4">
        <OnlineStatus userId={user.id} />
      </div>

      <div className="flex items-center space-x-6 mb-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user?.avatar || '/placeholder.svg'} alt={user?.displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-semibold">{user?.displayName}</h1>
          <p className="text-gray-500 dark:text-gray-400">@{user?.username}</p>
          {user?.school && (
            <p className="text-gray-500 dark:text-gray-400 flex items-center">
              <Briefcase className="mr-1 h-4 w-4" />
              {user.school}
            </p>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="mb-4">
        {user?.bio && (
          <Card className="mb-4">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{t('profile.aboutMe')}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {bioDisplay}
                {showReadMore && (
                  <button onClick={toggleBio} className="text-blue-500 dark:text-blue-400 ml-1">
                    {showFullBio ? t('profile.readLess') : t('profile.readMore')}
                  </button>
                )}
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.location && (
            <Card>
              <div className="flex items-center space-x-2 p-4">
                <MapPin className="text-gray-500 dark:text-gray-400 h-5 w-5" />
                <span>{user.location}</span>
              </div>
            </Card>
          )}

          {user?.createdAt && (
            <Card>
              <div className="flex items-center space-x-2 p-4">
                <Calendar className="text-gray-500 dark:text-gray-400 h-5 w-5" />
                <span>
                  {t('profile.joined')} {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start space-x-2">
        {!isCurrentUser && (
          <>
            {isFriend ? (
              <Button variant="destructive" onClick={onRemoveFriend} disabled={loading}>
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
              <Button onClick={onAddFriend} disabled={loading}>
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
            <Button variant="outline" onClick={() => navigate('/messages')}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t('profile.message')}
            </Button>
          </>
        )}

        {isCurrentUser && (
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            <Edit className="mr-2 h-4 w-4" />
            {t('profile.editProfile')}
          </Button>
        )}

        {/* Dropdown Menu */}
        {!isCurrentUser && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReportProfile}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                {t('profile.reportProfile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlockProfile}>
                <UserX className="mr-2 h-4 w-4" />
                {t('profile.blockProfile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Link to="/settings" className="w-full h-full block">
                  {t('profile.privacySettings')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
