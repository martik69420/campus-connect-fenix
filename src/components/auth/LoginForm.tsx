
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Key, Eye, EyeOff, RefreshCw, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/context/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  username: z.string().min(2, { message: "Username or email is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, authError, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [showRecoveryField, setShowRecoveryField] = useState(false);
  const [passwordNeedsReset, setPasswordNeedsReset] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    setIsLoading(true);
    setPasswordNeedsReset(false);
    
    try {
      // Handle temporary password case - check if this is a migrated user
      if (data.password === 'ChangeMe123!') {
        setPasswordNeedsReset(true);
        setLoginError("You're using a temporary password. Please reset your password after login.");
      }
      
      const success = await login(data.username, data.password);
      
      if (success) {
        // Show a toast for migrated users on successful login
        if (data.password === 'ChangeMe123!') {
          toast({
            title: "Welcome back!",
            description: "Your account was migrated from a previous system. Please update your password in settings.",
            duration: 8000,
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome back to Campus Fenix!",
          });
        }
        
        navigate('/', { replace: true });
      } else {
        const errorMessage = authError || "Login failed. Please check your credentials and try again.";
        setLoginError(errorMessage);
        
        if (errorMessage.includes('reset') || errorMessage.includes('account needs reset')) {
          setShowRecoveryField(true);
          setRecoveryEmail(data.username.includes('@') ? data.username : '');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during login";
      setLoginError(errorMessage);
      
      if (errorMessage.includes('reset') || errorMessage.includes('account needs reset')) {
        setShowRecoveryField(true);
        setRecoveryEmail(data.username.includes('@') ? data.username : '');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address for password reset",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(recoveryEmail);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for instructions to reset your password",
      });
      setShowRecoveryField(false);
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <Alert variant={passwordNeedsReset ? "default" : "destructive"} 
                 className={`mb-4 ${passwordNeedsReset ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your username or email"
                    className="pl-10"
                    autoComplete="username"
                    disabled={isLoading}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showRecoveryField && (
          <div className="pt-2 pb-4">
            <div className="bg-muted/50 p-4 rounded-md border">
              <p className="text-sm font-medium mb-2">Need to reset your password?</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  disabled={isResetting}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handlePasswordReset}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : "Reset"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In with Email
            </>
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
              Connecting...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setShowRecoveryField(!showRecoveryField)}
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
