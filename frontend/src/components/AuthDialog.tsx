import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { email: string; name: string; accessToken: string }) => void;
}

export function AuthDialog({ open, onClose, onAuthSuccess }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Login failed';
        // Provide user-friendly error messages
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
          throw new Error('Invalid email or password. Please check your credentials or register for a new account.');
        }
        throw new Error(errorMessage);
      }

      onAuthSuccess({
        email: data.user.email,
        name: data.user.name,
        accessToken: data.accessToken,
      });

      // Reset form
      setLoginEmail('');
      setLoginPassword('');
      toast.success(`Welcome back, ${data.user.name}!`);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          name: registerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Registration failed';
        // Provide user-friendly error messages
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('User already registered')) {
          throw new Error('This email is already registered. Please use the Login tab instead.');
        }
        if (errorMessage.includes('password') && errorMessage.includes('6')) {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw new Error(errorMessage);
      }

      onAuthSuccess({
        email: data.user.email,
        name: data.user.name,
        accessToken: data.accessToken,
      });

      // Reset form
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      toast.success(`Welcome to MarketAI, ${data.user.name}! Your account has been created.`);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome to MarketAI
          </DialogTitle>
          <DialogDescription>
            Sign in to save posts to your catalog and connect social media accounts
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <p className="text-xs text-blue-800">
            <strong>First time here?</strong> Use the <strong>Register</strong> tab to create your account. Already have an account? Use the <strong>Login</strong> tab.
          </p>
        </div>

        <Tabs defaultValue="register" className="w-full" onValueChange={() => setError('')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && loginEmail && loginPassword) {
                    handleLogin();
                  }
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={!loginEmail || !loginPassword || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">Full Name</Label>
              <Input
                id="register-name"
                type="text"
                placeholder="John Doe"
                value={registerName}
                onChange={(e) => {
                  setRegisterName(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={registerEmail}
                onChange={(e) => {
                  setRegisterEmail(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">Minimum 6 characters recommended</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleRegister}
              disabled={!registerEmail || !registerPassword || !registerName || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
