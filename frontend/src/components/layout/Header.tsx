import { Search, ChevronDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import NotificationDropdown from "./NotificationDropdown";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: userRole } = useQuery({
    queryKey: ['user-role-header', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const roles = ['admin', 'doctor', 'nurse', 'receptionist', 'cashier'] as const;

      for (const role of roles) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id.toString(),
          _role: role
        });
        if (data) return role;
      }
      return 'patient';
    },
    enabled: !!user
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'doctor': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'nurse': return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'cashier': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'receptionist': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-64">
            <Sidebar className="h-full border-r-0" onLinkClick={() => setIsSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Title */}
        <div>
          <h1 className="text-xl font-heading font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search */}
        <div className="relative w-full max-w-[200px] hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-secondary border-0 h-9"
          />
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="text-right hidden md:block mr-2">
                <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                {userRole && (
                  <Badge className={`mt-1 text-[10px] h-4 px-1.5 ${getRoleBadgeColor(userRole)}`}>
                    {userRole.toUpperCase()}
                  </Badge>
                )}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {userRole && (
                  <Badge className={`w-fit mt-1 ${getRoleBadgeColor(userRole)}`}>{userRole}</Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
