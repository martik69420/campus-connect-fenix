
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import ProfilePictureUpload from '../profile/ProfilePictureUpload';

export const ProfilePictureSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Here you would normally upload to your storage service
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
      
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      // Here you would remove the profile picture
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
      
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentAvatar = profile?.avatar_url || user?.avatar;
  const displayName = profile?.display_name || user?.displayName || user?.username || '';

  return (
    <Card className="mb-8">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Camera className="h-5 w-5 mr-2 text-primary" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload or change your profile picture. This will be visible to other users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-border shadow-lg">
              <AvatarImage 
                src={previewUrl || currentAvatar || '/placeholder.svg'} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl bg-primary/20">
                {displayName.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <ProfilePictureUpload
              currentAvatar={currentAvatar}
              onFileSelect={handleFileSelect}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
            />
            
            {selectedFile && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {currentAvatar && !selectedFile && (
              <Button 
                variant="destructive" 
                onClick={handleRemove}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Picture
              </Button>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Guidelines:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use a clear, high-quality image</li>
            <li>• Square images work best (1:1 ratio)</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
