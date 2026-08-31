import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import PlatformLogo from '@/components/PlatformLogo';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: 'demo@hireflow.app',
        password: 'Demo123!'
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Logged in with demo account"
      });

      // Set flag to indicate demo reset in progress
      sessionStorage.setItem('demo-reset-in-progress', 'true');
      
      // Navigate immediately
      navigate('/dashboard');

      // Reset demo data in background with notifications
      if (data.session) {
        toast({
          title: "Refreshing demo data",
          description: "Setting up your demo environment..."
        });
        supabase.functions.invoke('reset-demo-data', {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        }).then(() => {
          // Clear the flag
          sessionStorage.removeItem('demo-reset-in-progress');
          
          toast({
            title: "Demo data refreshed",
            description: "Your demo environment is ready"
          });
          // Dispatch event to notify dashboard to refresh
          window.dispatchEvent(new Event('demo-data-refreshed'));
        }).catch(resetError => {
          // Clear the flag even on error
          sessionStorage.removeItem('demo-reset-in-progress');
          console.error('Error resetting demo data:', resetError);
          toast({
            title: "Demo data refresh failed",
            description: "You can still use the existing demo data",
            variant: "destructive"
          });
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <PlatformLogo />
          </div>
          
          <CardDescription className="text-center">
            Sign in to your ATS account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={handleDemoLogin} disabled={loading}>
            Try Demo
          </Button>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Login;