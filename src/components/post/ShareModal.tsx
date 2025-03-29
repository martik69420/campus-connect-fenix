
import React, { useState } from "react";
import { Copy, Facebook, Link, Linkedin, Mail, Twitter } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, postId, postTitle = "" }) => {
  const { toast } = useToast();
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  
  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = postTitle ? `Check out this post: ${postTitle}` : "Check out this post!";
  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(postUrl);
  
  const shareLinks = [
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      url: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`,
      color: "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20"
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20"
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20"
    },
    {
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      url: `mailto:?subject=${encodedShareText}&body=${encodedUrl}`,
      color: "bg-primary/10 text-primary hover:bg-primary/20"
    },
  ];
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied!",
      description: "The post link has been copied to your clipboard.",
    });
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };
  
  const handleShareButtonClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>
            Choose how you'd like to share this content
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-3 py-4">
          {shareLinks.map((link) => (
            <Button
              key={link.name}
              variant="outline"
              size="icon"
              className={`rounded-full w-12 h-12 ${link.color}`}
              onClick={() => handleShareButtonClick(link.url)}
            >
              {link.icon}
              <span className="sr-only">{link.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 bg-secondary/50 p-3 rounded-lg">
          <div className="grid flex-1 gap-2">
            <div className="font-medium">Post link</div>
            <div className="truncate text-sm text-muted-foreground">{postUrl}</div>
          </div>
          <Popover open={showLinkCopied} onOpenChange={setShowLinkCopied}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                className="rounded-full"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy link</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <span className="text-xs">Copied!</span>
            </PopoverContent>
          </Popover>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
