import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Coins, Gift, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Earn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, addCoins } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Complete your profile',
      description: 'Add a profile picture and fill out your bio',
      reward: 50,
      completed: false,
    },
    {
      id: '2',
      title: 'Invite a friend',
      description: 'Share your referral link with a friend',
      reward: 100,
      completed: false,
    },
    {
      id: '3',
      title: 'Participate in a community event',
      description: 'Join a campus event and share your experience',
      reward: 75,
      completed: false,
    },
  ]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }

    // Simulate checking completed tasks from the database
    const checkCompletedTasks = async () => {
      setLoading(true);
      try {
        // Simulate fetching user data and checking completed tasks
        // Replace this with actual database calls
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

        // Example: Check if the user has a profile picture
        const hasProfilePicture = user?.avatar;
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id === '1') {
              return { ...task, completed: !!hasProfilePicture };
            }
            return task;
          })
        );
      } catch (error: any) {
        console.error('Error checking completed tasks:', error);
        toast({
          title: 'Failed to load tasks',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkCompletedTasks();
    }
  }, [user, isAuthenticated, isLoading, navigate, toast]);

  const handleClaimReward = async (taskId: string, reward: number) => {
    try {
      setLoading(true);
      // Simulate claiming the reward
      // Replace this with actual database calls
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

      // Update the task as completed
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, completed: true };
          }
          return task;
        })
      );

      // Add coins to the user's balance
      const success = await addCoins(reward, `Claimed reward for task ${taskId}`);

      if (success) {
        toast({
          title: 'Reward claimed',
          description: `You have claimed ${reward} coins!`,
        });
      } else {
        toast({
          title: 'Failed to claim reward',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Failed to claim reward',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Earn Coins</h1>
            <p className="text-muted-foreground">Complete tasks and earn coins</p>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="mr-2 h-5 w-5 text-yellow-500" />
            <span>{user?.coins || 0} Coins</span>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {task.title}
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{task.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-yellow-500" />
                      <span>{task.reward} Coins</span>
                    </div>
                    {!task.completed ? (
                      <Button
                        onClick={() => handleClaimReward(task.id, task.reward)}
                        disabled={loading}
                      >
                        Claim Reward
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        Claimed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
