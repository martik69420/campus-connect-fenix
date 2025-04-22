
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth';
import { Shield, Mail, Key } from 'lucide-react';

export const AccountSettings = () => {
  const { user } = useAuth();
  
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Account Settings
        </CardTitle>
        <CardDescription>
          Manage your account credentials and security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-6">
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="email" className="text-base">Email Address</Label>
              <Input 
                id="email" 
                value={user?.email || ""} 
                disabled 
                className="mt-2 bg-muted"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Key className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="password" className="text-base">Password</Label>
              <div className="mt-2 flex gap-4">
                <Input 
                  id="password" 
                  type="password" 
                  value="••••••••" 
                  disabled 
                  className="bg-muted"
                />
                <Button variant="outline">
                  Change Password
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6 mt-6">
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
