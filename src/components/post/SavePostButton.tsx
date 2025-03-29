
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SavePostButtonProps {
  postId: string;
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const SavePostButton: React.FC<SavePostButtonProps> = ({
  postId,
  className = '',
  showText = false,
  variant = 'ghost',
  size = 'sm',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) return;
      
      try {
        setIsCheckingSaved(true);
        const { data, error } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking saved status:', error);
        }
        
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsCheckingSaved(false);
      }
    };
    
    checkIfSaved();
  }, [postId, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        title: t('auth.requiresLogin'),
        description: t('auth.loginToSave'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (isSaved) {
        // Unsave the post
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: t('post.removed'),
          description: t('post.removedFromSaved'),
        });
      } else {
        // The critical fix: We need to ensure the user_id is referencing profiles, not auth.users
        // First check if the user profile exists
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('User profile check error:', profileError);
          throw new Error(t('common.error'));
        }
        
        if (!userProfile) {
          throw new Error('User profile not found');
        }
        
        // Now save the post with the verified user_id
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId,
          });
          
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: t('post.saved'),
          description: t('post.addedToSaved'),
        });
      }
    } catch (error: any) {
      console.error('Error toggling saved status:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        `text-muted-foreground hover:text-foreground transition-colors duration-200`,
        isSaved && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      onClick={handleSaveToggle}
      disabled={isSaving || isCheckingSaved}
    >
      <Bookmark 
        className={cn(
          "h-4 w-4", 
          showText && "mr-1.5", 
          "transition-colors duration-200",
          isSaved && "fill-yellow-500 text-yellow-500"
        )} 
      />
      {showText && (
        <span className={isSaved ? "text-yellow-500" : ""}>
          {isSaved ? t('post.saved') : t('post.save')}
        </span>
      )}
    </Button>
  );
};

export default SavePostButton;
