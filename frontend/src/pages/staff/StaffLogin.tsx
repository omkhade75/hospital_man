import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Heart, ArrowLeft, Stethoscope, Eye, EyeOff } from 'lucide-react';

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const { user, error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      toast.error(error.message || 'Failed to sign in');
      return;
    }

    if (user) {
      setLoading(false);
      toast.success('Welcome back!');

      // Redirect based on role
      // In our current backend, staff roles are simplified, 
      // but we can support the specific ones if they are in the database.
      if (user.role === 'cashier' as any) {
        navigate('/staff/dashboard/cashier');
      } else if (user.role === 'nurse') {
        navigate('/staff/dashboard/nurse');
      } else if (user.role === 'doctor') {
        navigate('/staff/dashboard/doctor');
      } else if (user.role === 'receptionist') {
        navigate('/staff/dashboard/reception');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'staff') {
        navigate('/dashboard'); // Generic staff dashboard
      } else {
        toast.info('You do not have staff access. Redirecting to patient portal...');
        navigate('/patient/dashboard');
      }
      return;
    }

    setLoading(false);
    toast.error('Authentication failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-green-600 mb-4 justify-center">
            <ArrowLeft className="h-4 w-4" />
            Back to Portal Selection
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Medicare Logo" className="h-8 w-8 object-contain" />
            <span className="text-2xl font-bold text-green-600">Staff Portal</span>
          </div>
          <CardTitle className="text-2xl">Staff Sign In</CardTitle>
          <CardDescription>
            Access the Hospital Management System
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your staff email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Need staff access?{' '}
              <Link to="/staff/register" className="text-green-600 hover:underline">
                Request access here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StaffLogin;
