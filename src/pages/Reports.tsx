
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Reports: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Report Center</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="my-reports">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                <TabsTrigger value="report-user">Report a User</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-reports" className="space-y-4">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You have no active reports</p>
                </div>
              </TabsContent>
              
              <TabsContent value="report-user" className="space-y-4">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Report form coming soon...</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
