
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    class: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      class: value
    }));
  };

  const classOptions = [
    '1A LAT', '1A WET', '1B LAT', '1B WET', '1C', '1D', '1E', '1F', '1G', '1H', '1I',
    '2A LAT', '2B E&O', '2C E&O', '2D STWE', '2E STWE', '2F STWE', '2G MTWE', '2H MTWE',
    '3BW', '3EWmt 1', '3EWmt 2', '3EWww', '3HW', '3LAww', '3MTec', '3MTww', '3NWww1', '3NWww2', '3TW',
    '4BW', '4EWww', '4HW', '4LAmt', '4LAww', '4MTec', '4MTww', '4NWmt', '4NWww', '4TW'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.class.trim()) {
      setError('Klas is verplicht');
      setIsSubmitting(false);
      return;
    }

    const userData = {
      username: formData.username.trim(),
      display_name: formData.displayName.trim(),
      class: formData.class.trim()
    };

    const result = await register(formData.email, formData.password, userData);
    
    if (result.error) {
      setError(result.error.message || 'Registration failed');
    } else {
      // Show success message and redirect to login
      navigate('/login', { 
        replace: true,
        state: { message: 'Account created successfully! Please sign in.' }
      });
    }
    
    setIsSubmitting(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Don't render if already authenticated
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
        <p className="text-muted-foreground mt-2">Word lid van je klas gemeenschap</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Account Aanmaken</CardTitle>
            <CardDescription className="text-center">
              Registreer om te beginnen met Campus Fenix
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(error || authError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Gebruikersnaam</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Gebruikersnaam"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Weergavenaam</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Jouw Naam"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Voer je email in"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">Klas</Label>
                <Select value={formData.class} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer je klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
