import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StaffProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'doctor' | 'nurse' | 'receptionist';
}

const StaffProtectedRoute = ({ children, requiredRole }: StaffProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!user) {
        setIsStaff(false);
        setChecking(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData) {
        setIsStaff(true);
        setUserRole(roleData.role);
      } else {
        setIsStaff(false);
      }
      setChecking(false);
    };

    if (!loading) {
      checkStaffStatus();
    }
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/staff/login" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/staff/pending" replace />;
  }

  // Check for required role
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default StaffProtectedRoute;
