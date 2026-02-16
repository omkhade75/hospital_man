import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Stethoscope, Info } from 'lucide-react';

const StaffRegister = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<'doctor' | 'nurse' | 'receptionist' | 'cashier'>('receptionist');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setLoading(false);
      toast.error(error.message || 'Failed to register');
      return;
    }

    // Sign in to create the approval request
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      toast.success('Account created! Please sign in to complete your access request.');
      navigate('/staff/login');
      return;
    }

    // Create staff approval request
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let requestError = null;

      try {
        // Try inserting with proper role
        const { error } = await supabase.from('staff_approval_requests').insert({
          user_id: user.id,
          email: email,
          full_name: fullName,
          requested_role: requestedRole,
        });
        requestError = error;

        // If 'cashier' fails (likely due to enum constraint), retry as receptionist with marker
        if (error && requestedRole === 'cashier' && error.message?.includes('invalid input value')) {
          console.warn("Cashier role not in DB Enum, falling back.");
          const { error: fallbackError } = await supabase.from('staff_approval_requests').insert({
            user_id: user.id,
            email: email,
            full_name: `${fullName} (REQUESTING CASHIER)`,
            requested_role: 'receptionist',
          });
          requestError = fallbackError;

          if (!fallbackError) {
            toast.info("Request submitted. Note: Cashier role requires admin database update, handled as Receptionist temporarily.");
          }
        }
      } catch (err: unknown) {
        requestError = err;
      }

      if (requestError) {
        console.error('Error creating approval request:', requestError);
        setLoading(false);
        toast.error('Failed to submit access request: ' + requestError.message);
        return;
      }
    }

    setLoading(false);
    toast.success('Access request submitted! An administrator will review your request.');
    navigate('/staff/pending');
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
          <CardTitle className="text-2xl">Request Staff Access</CardTitle>
          <CardDescription>
            Submit a request to access the Hospital Management System
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Staff access requires administrator approval. You will be notified once your request is reviewed.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Requested Role *</Label>
              <Select value={requestedRole} onValueChange={(value: 'doctor' | 'nurse' | 'receptionist') => setRequestedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Submitting request...' : 'Submit Access Request'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have staff access?{' '}
              <Link to="/staff/login" className="text-green-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StaffRegister;
