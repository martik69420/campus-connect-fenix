
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Award, Trophy, Medal, Crown, Gamepad2, UserPlus, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

type LeaderboardUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  coins: number;
  school: string;
  rank?: number;
  game_score?: number;
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [coinsLeaderboard, setCoinsLeaderboard] = useState<LeaderboardUser[]>([]);
  const [gameLeaderboard, setGameLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoinsRank, setUserCoinsRank] = useState<number | null>(null);
  const [userGameRank, setUserGameRank] = useState<number | null>(null);
  
  useEffect(() => {
    fetchLeaderboardData();
  }, []);
  
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Get coins leaderboard
      const { data: coinsData, error: coinsError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, coins, school')
        .order('coins', { ascending: false })
        .limit(10);
        
      if (coinsError) throw coinsError;
      
      // Get game leaderboard
      const { data: gamesData, error: gamesError } = await supabase
        .from('game_history')
        .select(`
          id,
          user_id,
          score,
          game_type,
          profiles:user_id (id, username, display_name, avatar_url, coins, school)
        `)
        .order('score', { ascending: false })
        .limit(100);
        
      if (gamesError) throw gamesError;
      
      // Process coins leaderboard
      const processedCoinsData = coinsData.map((profile, index) => ({
        ...profile,
        rank: index + 1
      }));
      
      setCoinsLeaderboard(processedCoinsData);
      
      // Process game leaderboard - get highest score per user
      const userBestScores = new Map<string, any>();
      
      gamesData.forEach(game => {
        const userId = game.user_id;
        const existingBest = userBestScores.get(userId);
        
        if (!existingBest || game.score > existingBest.score) {
          userBestScores.set(userId, {
            id: game.profiles.id,
            username: game.profiles.username,
            display_name: game.profiles.display_name,
            avatar_url: game.profiles.avatar_url,
            coins: game.profiles.coins,
            school: game.profiles.school,
            game_score: game.score,
            game_type: game.game_type
          });
        }
      });
      
      const topGameScores = Array.from(userBestScores.values())
        .sort((a, b) => b.game_score - a.game_score)
        .slice(0, 10)
        .map((userData, index) => ({
          ...userData,
          rank: index + 1
        }));
      
      setGameLeaderboard(topGameScores);
      
      // Find user's ranks
      if (user) {
        // Coins rank
        const userCoinsIndex = processedCoinsData.findIndex(item => item.id === user.id);
        if (userCoinsIndex !== -1) {
          setUserCoinsRank(userCoinsIndex + 1);
        } else {
          // Get user's actual rank
          const { count: usersWithMoreCoins, error: rankError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('coins', user.coins);
            
          if (!rankError) {
            setUserCoinsRank((usersWithMoreCoins || 0) + 1);
          }
        }
        
        // Game rank
        const userGameIndex = topGameScores.findIndex(item => item.id === user.id);
        if (userGameIndex !== -1) {
          setUserGameRank(userGameIndex + 1);
        }
      }
      
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Failed to load leaderboard",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-base font-medium w-5 text-center">{rank}</span>;
    }
  };
  
  const getNameHighlight = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500 font-bold";
      case 2:
        return "text-slate-400 font-bold";
      case 3:
        return "text-amber-700 font-bold";
      default:
        return "";
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">See how you rank against other students</p>
        </div>
        
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-fenix to-teal-500 p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold mb-1">Your Rankings</h2>
                  <p className="text-white/80">How you compare to others</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-white/80 text-sm mb-1">Coins Rank</div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      {userCoinsRank ? (
                        <>
                          {userCoinsRank} 
                          <Crown className="h-5 w-5 text-yellow-300" />
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/80 text-sm mb-1">Games Rank</div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      {userGameRank ? (
                        <>
                          {userGameRank}
                          <Gamepad2 className="h-5 w-5 text-yellow-300" />
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <Tabs defaultValue="coins">
          <TabsList className="mb-4">
            <TabsTrigger value="coins">
              <Award className="mr-2 h-4 w-4" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Games
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="coins">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Students with the most coins</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-6">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : coinsLeaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {coinsLeaderboard.map((profile) => (
                      <motion.div 
                        key={profile.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          user && profile.id === user.id ? 'bg-secondary/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(profile.rank!)}
                          </div>
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {profile.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className={`font-medium ${getNameHighlight(profile.rank!)}`}>
                              {profile.display_name}
                            </h3>
                            <div className="text-sm text-muted-foreground">@{profile.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="flex items-center justify-end text-yellow-500 font-bold">
                              <Award className="h-4 w-4 mr-1" />
                              {profile.coins}
                            </div>
                            <div className="text-xs text-muted-foreground">{profile.school}</div>
                          </div>
                          {user && profile.id !== user.id && (
                            <Button variant="ghost" size="icon" className="ml-2">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No data available</h3>
                    <p className="text-muted-foreground mt-1">
                      Be the first to earn coins and top the leaderboard!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="games">
            <Card>
              <CardHeader>
                <CardTitle>Game Champions</CardTitle>
                <CardDescription>Students with the highest game scores</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-6">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : gameLeaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {gameLeaderboard.map((profile) => (
                      <motion.div 
                        key={profile.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          user && profile.id === user.id ? 'bg-secondary/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(profile.rank!)}
                          </div>
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {profile.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className={`font-medium ${getNameHighlight(profile.rank!)}`}>
                              {profile.display_name}
                            </h3>
                            <div className="text-sm text-muted-foreground">@{profile.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="flex items-center justify-end text-green-500 font-bold">
                              <Gamepad2 className="h-4 w-4 mr-1" />
                              {profile.game_score}
                            </div>
                            <div className="text-xs text-muted-foreground">{profile.school}</div>
                          </div>
                          {user && profile.id !== user.id && (
                            <Button variant="ghost" size="icon" className="ml-2">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No game scores yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Play games to earn a spot on the leaderboard!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
