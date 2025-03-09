
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading, login } = useAuth();
  
  useEffect(() => {
    // Only redirect if we're sure the user is authenticated and auth is not still loading
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Don't render anything while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If user is authenticated, don't render the auth page
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-primary">Campus Fenix</h1>
        <p className="text-muted-foreground mt-2">Connect with your school community</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in or create an account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm loading={loading} setLoading={setLoading} />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm loading={loading} setLoading={setLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <div className="flex items-center justify-center gap-2 mt-2">
                <GraduationCap className="h-4 w-4" />
                <span>School-exclusive platform</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Users className="h-4 w-4" />
                <span>Invite-only community</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

interface FormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoginForm = ({ loading, setLoading }: FormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Use AuthContext login instead of Supabase directly
      const success = await login(username, inviteCode);
      
      if (success) {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <input
          id="username"
          type="text"
          placeholder="your_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
          autoComplete="username"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="invite-code" className="text-sm font-medium">Invite Code</label>
        <input
          id="invite-code"
          type="text"
          placeholder="Enter invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

const RegisterForm = ({ loading, setLoading }: FormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Use AuthContext register instead of Supabase directly
      const success = await register(username, displayName, school, inviteCode);
      
      if (success) {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <input
          id="username"
          type="text"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
          autoComplete="username"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
        <input
          id="displayName"
          type="text"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
          autoComplete="name"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="school" className="text-sm font-medium">School</label>
        <input
          id="school"
          type="text"
          placeholder="Example University"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="invite-code" className="text-sm font-medium">Invite Code</label>
        <input
          id="invite-code"
          type="text"
          placeholder="Enter invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
};

export default Auth;
