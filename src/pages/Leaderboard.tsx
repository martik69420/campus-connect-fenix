
import { useState, useEffect } from 'react';
import { Trophy, Users, Medal, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';

type LeaderboardUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  coins: number;
  school: string;
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [leaderboardType, setLeaderboardType] = useState<'all' | 'school'>('all');
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchLeaderboard();
  }, [user, leaderboardType]);
  
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, coins, school')
        .order('coins', { ascending: false })
        .limit(100);
      
      // Filter by school if school leaderboard is selected
      if (leaderboardType === 'school' && user?.school) {
        query = query.eq('school', user.school);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setLeaderboardUsers(data as LeaderboardUser[]);
        
        // Find current user's rank
        const userIndex = data.findIndex(profile => profile.id === user?.id);
        setUserRank(userIndex !== -1 ? userIndex + 1 : null);
      }
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Failed to load leaderboard',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper for medal icons
  const getRankDecoration = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="font-mono">{index + 1}</span>;
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground">See how you rank among other users</p>
          </div>
          
          <Tabs 
            value={leaderboardType} 
            onValueChange={(value) => setLeaderboardType(value as 'all' | 'school')}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Global</TabsTrigger>
              <TabsTrigger value="school">My School</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {userRank !== null && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {userRank}
                  </div>
                  <div>
                    <p className="font-medium">Your Rank</p>
                    <p className="text-sm text-muted-foreground">
                      {leaderboardType === 'all' ? 'Global' : 'School'} Ranking
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold">{user?.coins || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>
              {leaderboardType === 'all' 
                ? 'Global Rankings' 
                : `${user?.school || 'School'} Rankings`}
            </CardTitle>
            <CardDescription>
              Users ranked by coins earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              // Loading skeletons
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="ml-auto h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardUsers.map((leaderboardUser, index) => {
                  const isCurrentUser = leaderboardUser.id === user?.id;
                  
                  return (
                    <motion.div
                      key={leaderboardUser.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex items-center p-3 rounded-lg ${
                        isCurrentUser ? 'bg-primary/5' : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center">
                          {getRankDecoration(index)}
                        </div>
                        
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={leaderboardUser.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {leaderboardUser.display_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-medium flex items-center">
                            {leaderboardUser.display_name}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>@{leaderboardUser.username}</span>
                            <span className="text-xs">•</span>
                            <span>{leaderboardUser.school}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 font-bold">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        {leaderboardUser.coins}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => navigate(`/profile/${leaderboardUser.username}`)}
                      >
                        View
                      </Button>
                    </motion.div>
                  );
                })}
                
                {leaderboardUsers.length === 0 && (
                  <div className="text-center py-10">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No rankings available</h3>
                    <p className="text-muted-foreground mt-1">
                      Be the first to earn coins and claim your spot!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
