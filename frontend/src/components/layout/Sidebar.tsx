import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Building2,
  BedDouble,
  ClipboardList,
  Settings,
  LogOut,
  Activity,
  UserCheck,
  PhoneIncoming,
  ClipboardCheck,
  Banknote,
  Info,
  Siren,
  Truck,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

const Sidebar = ({ className, onLinkClick }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Check if user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id.toString(),
        _role: 'admin'
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is nurse
  const { data: isNurse = false } = useQuery({
    queryKey: ['is-nurse', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id.toString(),
        _role: 'nurse'
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is cashier
  const { data: isCashier = false } = useQuery({
    queryKey: ['is-cashier', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id.toString(),
        _role: 'cashier'
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is receptionist
  const { data: isReceptionist = false } = useQuery({
    queryKey: ['is-receptionist', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id.toString(),
        _role: 'receptionist'
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  // Get pending approvals count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staff_approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count || 0;
    },
    enabled: isAdmin,
  });

  // Get pending callbacks count
  const { data: callbacksCount = 0 } = useQuery({
    queryKey: ['pending-callbacks-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('callback_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count || 0;
    },
  });

  // Get active emergencies count for badge
  const { data: emergencyCount = 0 } = useQuery({
    queryKey: ['active-emergency-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('emergency_calls')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("completed","cancelled")');
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    onLinkClick?.();
  };

  let navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Patients", path: "/patients" },
    { icon: Stethoscope, label: "Doctors", path: "/doctors" },
    { icon: CalendarDays, label: "Appointments", path: "/appointments" },
    { icon: Building2, label: "Departments", path: "/departments" },
    { icon: BedDouble, label: "Bed Management", path: "/beds" },
    { icon: Siren, label: "Emergency", path: "/emergency/dashboard", badge: emergencyCount, emergency: true },
    { icon: Truck, label: "Ambulance", path: "/ambulance" },
    ...((isAdmin || isReceptionist || isCashier) ? [{ icon: PhoneIncoming, label: "Callbacks", path: "/callbacks", badge: callbacksCount }] : []),
    { icon: ClipboardList, label: "Reports", path: "/reports" },
    ...(isAdmin ? [
      { icon: HeartPulse, label: "Doctor Management", path: "/admin/doctors" },
      { icon: UserCheck, label: "Staff Approvals", path: "/staff/approvals", badge: pendingCount },
      { icon: Activity, label: "AI Tools", path: "/admin/ai-tools" },
      { icon: Banknote, label: "Manage Salaries", path: "/salaries" },
      { icon: Info, label: "System Info", path: "/admin/info" }
    ] : []),
  ];

  // Specific menu for Nurses
  if (isNurse && !isAdmin) {
    navItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Patients", path: "/patients" },
      { icon: Stethoscope, label: "Doctors", path: "/doctors" },
      { icon: BedDouble, label: "Bed Management", path: "/beds" },
      { icon: Siren, label: "Emergency", path: "/emergency/dashboard", badge: emergencyCount, emergency: true },
      { icon: Truck, label: "Ambulance", path: "/ambulance" },
      { icon: ClipboardList, label: "Reports", path: "/reports" },
      { icon: ClipboardCheck, label: "Rounds & Advice", path: "/nurse/rounds" },
    ];
  }

  // Specific menu for Cashiers
  if (isCashier && !isAdmin) {
    navItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/staff/dashboard/cashier" },
      { icon: PhoneIncoming, label: "Callbacks", path: "/callbacks", badge: callbacksCount },
      { icon: Siren, label: "Emergency", path: "/emergency/dashboard", badge: emergencyCount, emergency: true },
      { icon: Users, label: "Patients", path: "/patients" },
      { icon: Stethoscope, label: "Doctors", path: "/doctors" },
    ];
  }

  return (
    <aside className={cn("h-full w-64 bg-sidebar flex flex-col", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border shrink-0">
        <img src="/logo.png" alt="MediCare Logo" className="w-10 h-10 object-contain rounded-xl" />
        <div>
          <h1 className="text-lg font-heading font-bold text-sidebar-foreground">
            MediCare
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Hospital Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isEmergency = 'emergency' in item && item.emergency;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onLinkClick}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? isEmergency
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                    : "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : isEmergency
                    ? "text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isEmergency && !isActive && "animate-pulse")} />
                {item.label}
              </div>
              {'badge' in item && item.badge > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1 shrink-0">
        <Link
          to="/settings"
          onClick={onLinkClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
