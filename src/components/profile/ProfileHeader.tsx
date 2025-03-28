
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
      className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 z-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/30"></div>
        <div className="absolute right-20 bottom-5 w-20 h-20 rounded-full bg-blue-400/30"></div>
        <div className="absolute left-10 bottom-10 w-32 h-32 rounded-full bg-green-400/20"></div>
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-10">
        {/* Avatar and Online Status */}
        <div className="absolute top-4 right-4">
          <OnlineStatus userId={user.id} />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white dark:border-gray-700 shadow-md">
              <AvatarImage src={user?.avatar || '/placeholder.svg'} alt={user?.displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-3 flex-1">
            <div>
              <h1 className="text-3xl font-bold mb-1">{user?.displayName}</h1>
              <p className="text-muted-foreground flex items-center">
                <span className="mr-2">@{user?.username}</span>
                {/* Remove the verified badge reference since it's not in the User type */}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {user?.school && (
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-background/80">
                  <Briefcase className="w-3 h-3" />
                  <span>{user.school}</span>
                </Badge>
              )}
              
              {user?.location && (
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-background/80">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </Badge>
              )}
              
              {user?.createdAt && (
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-background/80">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {t('profile.joined')} {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* User Bio */}
        {user?.bio && (
          <Card className="my-6 bg-background/70 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{t('profile.aboutMe')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {bioDisplay}
                {showReadMore && (
                  <button onClick={toggleBio} className="text-primary ml-1 font-medium hover:underline">
                    {showFullBio ? t('profile.readLess') : t('profile.readMore')}
                  </button>
                )}
              </p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-start flex-wrap gap-3 mt-6">
          {!isCurrentUser && (
            <>
              {isFriend ? (
                <Button variant="outline" onClick={onRemoveFriend} disabled={loading} className="px-4 shadow-sm">
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
                <Button onClick={onAddFriend} disabled={loading} className="px-4 shadow-sm">
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
              <Button variant="outline" onClick={() => navigate('/messages')} className="shadow-sm">
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
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
