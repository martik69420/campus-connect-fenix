
import React, { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { useAuth } from '@/context/auth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Index />
    </AppLayout>
  );
};

export default Home;
