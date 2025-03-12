import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { CoinsIcon, Trophy, Medal, Ban, Info } from 'lucide-react';
import { motion } from 'framer-motion';

type LeaderboardUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  score: number;
  position: number;
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [leaderboardType, setLeaderboardType] = useState<'coins' | 'trivia' | 'snake'>('coins');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Load leaderboard data
  useEffect(() => {
    if (user) {
      fetchLeaderboardData(leaderboardType);
    }
  }, [user, leaderboardType]);
  
  const fetchLeaderboardData = async (type: 'coins' | 'trivia' | 'snake') => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      let data: LeaderboardUser[] = [];
      
      if (type === 'coins') {
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, coins')
          .order('coins', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error("Error fetching coin leaderboard:", error);
          throw error;
        }
        
        if (profilesData) {
          data = profilesData.map((profile, index) => ({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            avatar: profile.avatar_url || '/placeholder.svg',
            score: profile.coins || 0,
            position: index + 1
          }));
        }
      } else {
        // For game scores
        const gameType = type === 'trivia' ? 'trivia' : 'snake';
        
        const { data: gameData, error } = await supabase
          .from('game_history')
          .select('id, user_id, score, created_at, profiles:user_id(username, display_name, avatar_url)')
          .eq('game_type', gameType)
          .order('score', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error(`Error fetching ${gameType} leaderboard:`, error);
          throw error;
        }
        
        if (gameData) {
          data = gameData.map((game, index) => ({
            id: game.user_id,
            username: game.profiles?.username || 'Unknown',
            displayName: game.profiles?.display_name || 'Unknown User',
            avatar: game.profiles?.avatar_url || '/placeholder.svg',
            score: game.score,
            position: index + 1
          }));
        }
      }
      
      // If we don't have data from the database, use mock data as fallback
      if (data.length === 0) {
        data = getMockLeaderboardData(type);
      }
      
      setLeaderboardData(data);
      
      // Find user's rank
      const currentUserRank = data.find(item => item.id === user.id);
      if (currentUserRank) {
        setUserRank(currentUserRank);
      } else {
        // If user is not in top 20, query their specific rank
        if (type === 'coins') {
          // Count users with more coins than current user
          const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('coins', user.coins || 0);
            
          if (!error && count !== null) {
            setUserRank({
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar || '/placeholder.svg',
              score: user.coins || 0,
              position: count + 1 // +1 because count is number of users with MORE coins
            });
          }
        } else {
          // For games, we'd need a similar query but for game scores
          // Simplified for now
          setUserRank({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar || '/placeholder.svg',
            score: 0,
            position: data.length + 1
          });
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      // Fallback to mock data
      const mockData = getMockLeaderboardData(type);
      setLeaderboardData(mockData);
      
      const mockUserRank = mockData.find(item => item.id === user.id) || {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar || '/placeholder.svg',
        score: type === 'coins' ? user.coins : 0,
        position: mockData.length + 1
      };
      
      setUserRank(mockUserRank);
    } finally {
      setLoading(false);
    }
  };
  
  // Get trophy icon based on position
  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="font-bold text-muted-foreground">{position}</span>;
    }
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you rank against other users on the platform
          </p>
        </div>
        
        <Tabs 
          defaultValue="coins" 
          className="w-full" 
          onValueChange={(value) => setLeaderboardType(value as 'coins' | 'trivia' | 'snake')}
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="coins" className="text-center">
              <CoinsIcon className="h-4 w-4 mr-2" />
              <span>Coins</span>
            </TabsTrigger>
            <TabsTrigger value="trivia" className="text-center">
              <span>Trivia</span>
            </TabsTrigger>
            <TabsTrigger value="snake" className="text-center">
              <span>Snake</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="coins" className="space-y-4">
            <LeaderboardContent 
              title="Top Earners" 
              data={leaderboardData} 
              loading={loading} 
              unit="coins" 
              userRank={userRank}
              getTrophyIcon={getTrophyIcon}
            />
          </TabsContent>
          
          <TabsContent value="trivia" className="space-y-4">
            <LeaderboardContent 
              title="Trivia Masters" 
              data={leaderboardData} 
              loading={loading} 
              unit="points" 
              userRank={userRank}
              getTrophyIcon={getTrophyIcon}
            />
          </TabsContent>
          
          <TabsContent value="snake" className="space-y-4">
            <LeaderboardContent 
              title="Snake Champions" 
              data={leaderboardData} 
              loading={loading} 
              unit="points" 
              userRank={userRank}
              getTrophyIcon={getTrophyIcon}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Leaderboard content component
const LeaderboardContent = ({ 
  title, 
  data, 
  loading, 
  unit,
  userRank, 
  getTrophyIcon 
}: { 
  title: string, 
  data: LeaderboardUser[], 
  loading: boolean,
  unit: string,
  userRank: LeaderboardUser | null, 
  getTrophyIcon: (position: number) => React.ReactNode 
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded mt-1" />
              </div>
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      
      {data.length > 0 ? (
        <motion.div 
          className="space-y-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data.map((item) => (
            <LeaderboardItem 
              key={item.id} 
              user={item} 
              getTrophyIcon={getTrophyIcon}
              unit={unit}
            />
          ))}
        </motion.div>
      ) : (
        <Card className="p-6 text-center">
          <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium">No data available</h3>
          <p className="text-muted-foreground mt-1">
            Be the first to get on this leaderboard!
          </p>
        </Card>
      )}
      
      {/* User's rank if not in top list */}
      {userRank && !data.some(d => d.id === userRank.id) && (
        <div className="mt-8">
          <div className="text-sm text-muted-foreground mb-2">Your Rank</div>
          <LeaderboardItem 
            user={userRank} 
            getTrophyIcon={getTrophyIcon}
            unit={unit}
            highlight
          />
        </div>
      )}
    </div>
  );
};

// Individual leaderboard item
const LeaderboardItem = ({ 
  user, 
  getTrophyIcon,
  unit,
  highlight = false 
}: { 
  user: LeaderboardUser, 
  getTrophyIcon: (position: number) => React.ReactNode,
  unit: string,
  highlight?: boolean 
}) => {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
      <Card className={`p-3 ${highlight ? 'bg-secondary' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            {getTrophyIcon(user.position)}
          </div>
          
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{user.displayName}</div>
            <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
          </div>
          
          <div className="font-bold whitespace-nowrap">
            {user.score.toLocaleString()} {unit}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Get mock leaderboard data
const getMockLeaderboardData = (type: 'coins' | 'trivia' | 'snake'): LeaderboardUser[] => {
  const mockData: LeaderboardUser[] = [
    {
      id: '1',
      username: 'john_doe',
      displayName: 'John Doe',
      avatar: '/placeholder.svg',
      score: type === 'coins' ? 1250 : 950,
      position: 1
    },
    {
      id: '2',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      avatar: '/placeholder.svg',
      score: type === 'coins' ? 975 : 825,
      position: 2
    },
    {
      id: '3',
      username: 'alex_johnson',
      displayName: 'Alex Johnson',
      avatar: '/placeholder.svg',
      score: type === 'coins' ? 840 : 780,
      position: 3
    },
    {
      id: '4',
      username: 'sarah_parker',
      displayName: 'Sarah Parker',
      avatar: '/placeholder.svg',
      score: type === 'coins' ? 720 : 650,
      position: 4
    },
    {
      id: '5',
      username: 'mike_robinson',
      displayName: 'Mike Robinson',
      avatar: '/placeholder.svg',
      score: type === 'coins' ? 680 : 520,
      position: 5
    }
  ];

  return mockData;
};

export default Leaderboard;
