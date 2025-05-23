
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import AppLayout from '@/components/layout/AppLayout';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { Button } from '@/components/ui/button';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto space-y-12 py-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and set preferences.
          </p>
        </div>

        <div className="space-y-12">
          <ProfileSettings />
          <AccountSettings />
          <AppearanceSettings />
          <NotificationSettings />
          <PrivacySettings />
        </div>

        <Button variant="destructive" onClick={handleLogout} className="mt-8">
          Logout
        </Button>
      </div>
    </AppLayout>
  );
};

export default Settings;
