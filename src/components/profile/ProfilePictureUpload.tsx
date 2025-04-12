import * as React from 'react';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserRound, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureUploadProps {
  currentAvatar?: string | null;
  onFileSelect?: (file: File) => void;
  previewUrl?: string | null;
  setPreviewUrl?: React.Dispatch<React.SetStateAction<string | null>>;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatar,
  onFileSelect,
  previewUrl,
  setPreviewUrl
}) => {
  const { user, uploadProfilePicture } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // If parent component has provided callbacks, use those
    if (onFileSelect) {
      onFileSelect(file);
      
      // Create preview URL
      if (setPreviewUrl) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // Otherwise use the default behavior
    try {
      setIsUploading(true);
      await uploadProfilePicture(file);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Determine which avatar URL to use
  const avatarUrl = previewUrl || (currentAvatar !== undefined ? currentAvatar : user?.avatar);
  const displayName = user?.displayName || "";

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={avatarUrl || ""} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
          {displayName?.charAt(0) || user?.username?.charAt(0) || <UserRound />}
        </AvatarFallback>
      </Avatar>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      
      <Button
        variant="secondary"
        size="icon"
        className="absolute -bottom-2 -right-2 rounded-full opacity-90 hover:opacity-100"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleButtonClick}>
        <Camera className="h-6 w-6 text-white" />
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
