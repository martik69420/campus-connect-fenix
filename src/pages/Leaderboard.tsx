
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Trophy, Users, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  max_score: number;
  total_games: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [snakeLeaderboard, setSnakeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [triviaLeaderboard, setTriviaLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('snake');
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
    
    fetchLeaderboardData();
  }, [isAuthenticated, isLoading, navigate]);
  
  const fetchLeaderboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch Snake leaderboard
      const { data: snakeData, error: snakeError } = await supabase
        .from('game_history')
        .select(`
          user_id,
          score,
          profiles!inner(id, username, display_name, avatar_url)
        `)
        .eq('game_type', 'snake')
        .order('score', { ascending: false });
        
      if (snakeError) throw snakeError;
      
      // Fetch Trivia leaderboard
      const { data: triviaData, error: triviaError } = await supabase
        .from('game_history')
        .select(`
          user_id,
          score,
          profiles!inner(id, username, display_name, avatar_url)
        `)
        .eq('game_type', 'trivia')
        .order('score', { ascending: false });
        
      if (triviaError) throw triviaError;
      
      // Process Snake data
      const snakeScores = new Map<string, LeaderboardEntry>();
      snakeData?.forEach(record => {
        const userId = record.user_id;
        const existing = snakeScores.get(userId);
        
        if (!existing || record.score > existing.max_score) {
          snakeScores.set(userId, {
            id: record.profiles.id,
            username: record.profiles.username,
            display_name: record.profiles.display_name,
            avatar_url: record.profiles.avatar_url,
            max_score: record.score,
            total_games: (existing?.total_games || 0) + 1
          });
        } else {
          existing.total_games += 1;
        }
      });
      
      // Process Trivia data
      const triviaScores = new Map<string, LeaderboardEntry>();
      triviaData?.forEach(record => {
        const userId = record.user_id;
        const existing = triviaScores.get(userId);
        
        if (!existing || record.score > existing.max_score) {
          triviaScores.set(userId, {
            id: record.profiles.id,
            username: record.profiles.username,
            display_name: record.profiles.display_name,
            avatar_url: record.profiles.avatar_url,
            max_score: record.score,
            total_games: (existing?.total_games || 0) + 1
          });
        } else {
          existing.total_games += 1;
        }
      });
      
      setSnakeLeaderboard(Array.from(snakeScores.values()).sort((a, b) => b.max_score - a.max_score));
      setTriviaLeaderboard(Array.from(triviaScores.values()).sort((a, b) => b.max_score - a.max_score));
    } catch (error: any) {
      console.error('Error fetching leaderboard data:', error);
      toast({
        title: "Failed to load leaderboard",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => {
    if (loading) {
      return (
        <div className="flex justify-center p-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-10">
          <Gamepad2 className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No scores yet</h3>
          <p className="text-muted-foreground mt-1">
            Be the first to play and set a high score!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((player, index) => (
          <motion.div 
            key={player.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                {index === 1 && <Trophy className="h-6 w-6 text-gray-400" />}
                {index === 2 && <Trophy className="h-6 w-6 text-amber-600" />}
                {index > 2 && <span className="font-bold text-lg">{index + 1}</span>}
              </div>
              <Avatar>
                <AvatarImage src={player.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {player.display_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{player.display_name}</h3>
                <p className="text-sm text-muted-foreground">@{player.username}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{player.max_score} pts</div>
              <div className="text-sm text-muted-foreground">{player.total_games} games</div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };
  
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Game Leaderboard</h1>
            <p className="text-muted-foreground">See who's dominating the games!</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="snake">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Snake
            </TabsTrigger>
            <TabsTrigger value="trivia">
              <Trophy className="mr-2 h-4 w-4" />
              Trivia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="snake">
            <Card>
              <CardHeader>
                <CardTitle>Snake High Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(snakeLeaderboard)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trivia">
            <Card>
              <CardHeader>
                <CardTitle>Trivia High Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(triviaLeaderboard)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
