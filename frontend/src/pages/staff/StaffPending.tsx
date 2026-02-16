import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Clock, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const StaffPending = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        navigate('/staff/login');
        return;
      }

      // First check if user now has a role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData) {
        toast.success('Your access has been approved!');
        navigate('/');
        return;
      }

      // Check approval request status
      const { data: approvalData } = await supabase
        .from('staff_approval_requests')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (approvalData) {
        setStatus(approvalData.status);
      } else {
        setStatus('none');
      }
      setLoading(false);
    };

    checkStatus();

    // Set up realtime subscription for status updates
    const channel = supabase
      .channel('approval-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staff_approval_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          if (newStatus === 'approved') {
            toast.success('Your access has been approved!');
            // Check for role and redirect
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else if (newStatus === 'rejected') {
            toast.error('Your access request was rejected.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Stethoscope className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">Staff Portal</span>
          </div>
          
          {status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Access Request Pending</CardTitle>
              <CardDescription className="text-base">
                Your request is being reviewed by an administrator
              </CardDescription>
            </>
          )}

          {status === 'approved' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Access Approved!</CardTitle>
              <CardDescription className="text-base">
                Redirecting you to the dashboard...
              </CardDescription>
            </>
          )}

          {status === 'rejected' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription className="text-base">
                Your access request was rejected. Please contact the administrator.
              </CardDescription>
            </>
          )}

          {status === 'none' && (
            <>
              <CardTitle className="text-2xl">No Access Request Found</CardTitle>
              <CardDescription className="text-base">
                Please submit an access request to gain staff access.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'pending' && (
            <div className="space-y-4">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                Pending Approval
              </Badge>
              <p className="text-sm text-muted-foreground">
                You will receive a notification once your request has been reviewed.
                This page will automatically update when your status changes.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {status === 'none' && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link to="/staff/register">Submit Access Request</Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Back to Portal Selection</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPending;
