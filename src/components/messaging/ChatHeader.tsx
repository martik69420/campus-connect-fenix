
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import OnlineStatus from '@/components/OnlineStatus';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface ChatHeaderProps {
  contact: Contact | null;
  onOpenUserActions: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ contact, onOpenUserActions }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!contact) return null;

  return (
    <div className="border-b p-3 flex justify-between items-center dark:border-gray-800">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.displayName || contact.username} />
            <AvatarFallback>
              {contact.displayName?.charAt(0) || contact.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <OnlineStatus userId={contact.id} className="absolute -bottom-1 -right-1" />
        </div>
        <div>
          <h3 className="font-medium line-clamp-1">
            {contact.displayName || contact.username}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <OnlineStatus userId={contact.id} showLabel />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Video className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/profile/${contact.username}`)}>
              {t('messages.viewProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('messages.muteNotifications')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('messages.clearChat')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onOpenUserActions}
              className="text-destructive focus:text-destructive"
            >
              {t('messages.reportUser')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
