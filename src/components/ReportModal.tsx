
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'hate_speech' | 'violence' | 'other';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'user' | 'post';
  targetId: string;
  targetName?: string;
}

interface ReportFormValues {
  reason: ReportReason;
  details: string;
}

const reasonOptions: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or harmful content' },
  { value: 'other', label: 'Other' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onClose,
  type,
  targetId,
  targetName
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<ReportFormValues>({
    defaultValues: {
      reason: 'inappropriate',
      details: ''
    }
  });
  
  const handleSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({
        title: "You must be logged in",
        description: "Please log in to report content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (type === 'user') {
        const { error } = await supabase
          .from('user_reports')
          .insert({
            reporter_id: user.id,
            reported_user_id: targetId,
            reason: values.reason,
            details: values.details
          });
          
        if (error) throw error;
        
        toast({
          title: "Report submitted",
          description: `Thank you for reporting ${targetName || 'this user'}. We'll review this account.`,
        });
      } else {
        const { error } = await supabase
          .from('post_reports')
          .insert({
            reporter_id: user.id,
            post_id: targetId,
            reason: values.reason,
            details: values.details
          });
          
        if (error) throw error;
        
        toast({
          title: "Report submitted",
          description: "Thank you for reporting this post. We'll review it.",
        });
      }
      
      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Report {type === 'user' ? targetName || 'User' : 'Post'}
          </DialogTitle>
          <DialogDescription>
            Please let us know why you're reporting this {type}.
            Your report will be sent to our team for review.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for reporting</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional details (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide any additional details about this report..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
