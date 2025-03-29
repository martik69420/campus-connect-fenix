
import React, { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { Coins, Calendar, UserCircle, Users, Gamepad, Award, PieChart, Gift, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Earn = () => {
  const { user } = useAuth();
  const { hasDailyRewardAvailable, claimDailyReward } = useGame();
  const { t } = useLanguage();

  const handleClaimDailyReward = () => {
    claimDailyReward();
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Coins className="h-6 w-6 text-yellow-500" />
              {t('earn.title')}
            </h1>
            <p className="text-muted-foreground">{t('earn.subtitle')}</p>
          </div>
          
          <Card className="bg-card shadow-md w-full md:w-auto">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('earn.yourBalance')}</p>
                  <p className="text-2xl font-bold">{user?.coins || 0}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/store">{t('earn.spend')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Reward Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-yellow-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    {t('earn.dailyReward')}
                  </CardTitle>
                  <CardDescription>{t('earn.comeBack')}</CardDescription>
                </div>
                <Badge className="bg-yellow-500 text-yellow-950">
                  <Gift className="mr-1 h-3.5 w-3.5" />
                  25
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                <Coins className="h-5 w-5 text-yellow-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('earn.dailyCoins')}</p>
                  <p className="text-xs text-muted-foreground">{t('earn.claimOnce')}</p>
                </div>
              </div>
              {!hasDailyRewardAvailable && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{t('earn.nextReward')}</span>
                    <span>12h 34m</span>
                  </div>
                  <Progress value={48} className="h-2" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleClaimDailyReward} 
                disabled={!hasDailyRewardAvailable} 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-medium"
              >
                {hasDailyRewardAvailable ? t('earn.claimReward') : t('earn.claimed')}
              </Button>
            </CardFooter>
          </Card>

          {/* Complete Profile Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-blue-500" />
                    {t('earn.completeProfile')}
                  </CardTitle>
                  <CardDescription>{t('earn.addMoreInfo')}</CardDescription>
                </div>
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30" variant="outline">
                  +50
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center bg-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm">Profile Picture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center bg-transparent"></div>
                  <span className="text-sm">Biography</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center bg-transparent"></div>
                  <span className="text-sm">School Information</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/settings">{t('earn.editProfile')}</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Invite Friends Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-green-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    {t('earn.inviteFriends')}
                  </CardTitle>
                  <CardDescription>{t('earn.shareTheFun')}</CardDescription>
                </div>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30" variant="outline">
                  +20
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                <Users className="h-5 w-5 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('earn.inviteReward')}</p>
                  <p className="text-xs text-muted-foreground">{t('earn.perFriend')}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled className="w-full">{t('earn.invite')}</Button>
            </CardFooter>
          </Card>

          {/* Play Games Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-purple-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad className="w-5 h-5 text-purple-500" />
                    {t('earn.playGames')}
                  </CardTitle>
                  <CardDescription>{t('earn.earnWhilePlaying')}</CardDescription>
                </div>
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30" variant="outline">
                  +5-100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-md">
                  <span className="text-xs text-muted-foreground">Snake</span>
                  <span className="text-sm font-medium">+1 per 10 pts</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-md">
                  <span className="text-xs text-muted-foreground">Trivia</span>
                  <span className="text-sm font-medium">+5 per correct</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/games">{t('earn.playNow')}</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Participate in Events Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-orange-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-orange-500" />
                    {t('earn.participateEvents')}
                  </CardTitle>
                  <CardDescription>{t('earn.joinCommunityEvents')}</CardDescription>
                </div>
                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30" variant="outline">
                  +50-200
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('earn.upcomingEvents')}</p>
                  <p className="text-xs text-muted-foreground">{t('earn.stayTuned')}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled className="w-full">{t('earn.viewEvents')}</Button>
            </CardFooter>
          </Card>

          {/* Leaderboard Reward Card */}
          <Card className="bg-card shadow-md hover:shadow-lg transition-all border-t-4 border-red-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-500" />
                    {t('earn.leaderboardRewards')}
                  </CardTitle>
                  <CardDescription>{t('earn.competeForPrizes')}</CardDescription>
                </div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/30" variant="outline">
                  +500
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                <Trophy className="h-5 w-5 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('earn.weeklyChallenge')}</p>
                  <p className="text-xs text-muted-foreground">{t('earn.topPlayersRewarded')}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/leaderboard">{t('earn.viewLeaderboard')}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
