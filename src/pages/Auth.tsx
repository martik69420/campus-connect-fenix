
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Users } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading, user, authError } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

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
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
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
                <span>Connect with your classmates</span>
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
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Email/username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const success = await login(identifier, password);
      
      if (success) {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      // Error is now handled in the AuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Username</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="email@example.com or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          disabled={loading}
          autoComplete="username"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />
      </div>
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};

const RegisterForm = ({ loading, setLoading }: FormProps) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !displayName.trim() || !school.trim() || !password.trim() || !email.trim()) {
      toast({
        title: "Please fill all fields",
        description: "All fields are required to create an account",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const success = await register(email, password, username, displayName, school);
      
      if (success) {
        navigate('/', { replace: true });
        toast({
          title: "Registration successful",
          description: "Welcome to Campus Fenix!",
        });
      }
      // Errors are handled in the AuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="school">School</Label>
        <Input
          id="school"
          type="text"
          placeholder="Example University"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
          autoComplete="organization"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
      </div>
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
};

export default Auth;
