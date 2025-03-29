import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Earn = () => {
  const { user } = useAuth();
  const { hasDailyRewardAvailable, claimDailyReward } = useGame();
  const { t } = useLanguage();

  const handleClaimDailyReward = () => {
    const claimed = claimDailyReward();
    if (claimed) {
      // Reward claimed successfully
    } else {
      // Reward already claimed or not available
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Reward Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.dailyReward')}</CardTitle>
              <CardDescription>{t('earn.comeBack')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t('earn.reward')}</span>
                <Badge className="bg-yellow-500 text-yellow-900 dark:text-yellow-500 dark:bg-yellow-900/20">
                  <Coins className="mr-2 h-4 w-4" />
                  25
                </Badge>
              </div>
              <Button onClick={handleClaimDailyReward} disabled={!hasDailyRewardAvailable()} className="w-full">
                {hasDailyRewardAvailable() ? t('earn.claimReward') : t('earn.claimed')}
              </Button>
            </CardContent>
          </Card>

          {/* Complete Profile Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.completeProfile')}</CardTitle>
              <CardDescription>{t('earn.addMoreInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('earn.addAvatarBio')}</p>
              <Button asChild>
                <Link to="/settings">{t('earn.editProfile')}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Invite Friends Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.inviteFriends')}</CardTitle>
              <CardDescription>{t('earn.shareTheFun')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('earn.inviteYourFriends')}</p>
              <Button disabled>{t('earn.invite')}</Button>
            </CardContent>
          </Card>

          {/* Play Games Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.playGames')}</CardTitle>
              <CardDescription>{t('earn.earnWhilePlaying')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('earn.playMiniGames')}</p>
              <Button asChild>
                <Link to="/games">{t('earn.playNow')}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Participate in Events Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.participateEvents')}</CardTitle>
              <CardDescription>{t('earn.joinCommunityEvents')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('earn.participateEventsDesc')}</p>
              <Button disabled>{t('earn.viewEvents')}</Button>
            </CardContent>
          </Card>

          {/* Leaderboard Reward Card */}
          <Card className="bg-card shadow-md">
            <CardHeader>
              <CardTitle>{t('earn.leaderboardRewards')}</CardTitle>
              <CardDescription>{t('earn.competeForPrizes')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('earn.topPlayersRewarded')}</p>
              <Button asChild>
                <Link to="/leaderboard">{t('earn.viewLeaderboard')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
