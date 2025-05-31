import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const Earn = () => {
  const { user, isAuthenticated, addCoins } = useAuth();
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false);

  useEffect(() => {
    // Check if the user has already claimed the daily reward today
    const lastClaimed = localStorage.getItem('lastClaimed');
    if (lastClaimed) {
      const lastClaimedDate = new Date(parseInt(lastClaimed));
      const today = new Date();
      if (
        lastClaimedDate.getDate() === today.getDate() &&
        lastClaimedDate.getMonth() === today.getMonth() &&
        lastClaimedDate.getFullYear() === today.getFullYear()
      ) {
        setHasClaimedDaily(true);
      }
    }
  }, []);

  const handleDailyReward = async () => {
    if (isAuthenticated && user) {
      const result = await addCoins(50); // Use single argument
      if (result.success) {
        setHasClaimedDaily(true);
        toast({
          title: "Daily Reward Claimed!",
          description: "You earned 50 coins!",
        });
      }
    }
  };

  useEffect(() => {
    // Save the claim date to localStorage
    if (hasClaimedDaily) {
      localStorage.setItem('lastClaimed', Date.now().toString());
    }
  }, [hasClaimedDaily]);

  return (
    <div className="container mx-auto py-10">
      <Card className="w-[400px] mx-auto">
        <CardHeader>
          <CardTitle>Earn Coins</CardTitle>
          <CardDescription>Complete tasks to earn coins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Daily Reward</span>
            <Button
              variant="outline"
              disabled={hasClaimedDaily || !isAuthenticated}
              onClick={handleDailyReward}
            >
              {hasClaimedDaily ? 'Claimed' : 'Claim 50 Coins'}
            </Button>
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              You must be logged in to claim rewards.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Earn;
