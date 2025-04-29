
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          // If we have a session, refresh the user data
          await refreshUser();
          
          toast({
            title: "Authentication successful",
            description: "You have successfully signed in with Google.",
          });
          
          // Redirect to the home page
          navigate('/', { replace: true });
        } else {
          // If we don't have a session, something went wrong
          setError("Authentication failed. Please try again.");
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {error ? (
          <>
            <div className="text-destructive text-xl font-bold mb-4">Authentication Failed</div>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-4">Redirecting you back to the login page...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-2">Completing Authentication</h1>
            <p className="text-muted-foreground">Please wait while we complete your authentication...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
