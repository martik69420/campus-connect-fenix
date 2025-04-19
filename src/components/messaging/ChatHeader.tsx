
import React, { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);

  if (!contact) return null;

  const startCall = (video: boolean) => {
    setIsVideoCall(video);
    setIsCallModalOpen(true);
    
    // In a real app, this would initiate an actual call
    setTimeout(() => {
      setIsCallModalOpen(false);
      toast({
        title: `${video ? "Video" : "Audio"} call feature`,
        description: "This feature is coming soon!",
        variant: "default",
      });
    }, 3000);
  };

  return (
    <>
      <div className="border-b p-3 flex justify-between items-center dark:border-gray-800 bg-muted/20 backdrop-blur-sm">
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
              {contact.displayName} 
              <span className="font-normal text-muted-foreground text-sm ml-1">
                @{contact.username}
              </span>
            </h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <OnlineStatus userId={contact.id} showLabel showLastActive />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
            onClick={() => startCall(false)}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            onClick={() => startCall(true)}
          >
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

      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isVideoCall ? "Video Call" : "Voice Call"}</DialogTitle>
            <DialogDescription>
              Calling {contact.displayName}...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.displayName} />
              <AvatarFallback className="text-3xl">
                {contact.displayName?.charAt(0) || contact.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="animate-pulse text-primary font-medium">Connecting...</div>
            
            <div className="mt-6 flex gap-4">
              <Button variant="destructive" onClick={() => setIsCallModalOpen(false)}>
                End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHeader;
