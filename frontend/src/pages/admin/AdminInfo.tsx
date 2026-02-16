import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Shield, Eye, Lock, RefreshCw, Copy, EyeOff, AlertTriangle, Terminal } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminInfo = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    interface AdminUser {
        id: string;
        email: string;
        full_name: string;
        role: string;
        created_at: string;
        last_sign_in_at: string | null;
        encrypted_password: string | null;
        _source: 'rpc' | 'fallback';
    }

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-user-directory'],
        queryFn: async () => {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - RPC types might be missing in generated types
                const { data, error } = await supabase.rpc('get_all_users_secure');
                if (error) throw error;
                // Cast the response to our expected type
                return (data as unknown as AdminUser[]).map((u) => ({ ...u, _source: 'rpc' as const }));
            } catch (err) {
                console.warn("Secure RPC failed, falling back to public tables", err);

                const { data: profiles } = await supabase.from('profiles').select('*');
                const { data: roles } = await supabase.from('user_roles').select('*');
                const { data: requests } = await supabase.from('staff_approval_requests').select('*');

                const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
                const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
                const requestMap = new Map((requests || []).map((r) => [r.user_id, r]));

                // Collect all unique user IDs
                const allUserIds = new Set([
                    ...(profiles || []).map((p) => p.user_id),
                    ...(roles || []).map((r) => r.user_id),
                    ...(requests || []).map((r) => r.user_id)
                ]);

                return Array.from(allUserIds).map(userId => {
                    const profile = profileMap.get(userId);
                    const role = roleMap.get(userId);
                    const request = requestMap.get(userId);

                    // Determine User Details (Priority: Profile > Request > Placeholder)
                    const full_name = profile?.full_name || request?.full_name || 'Unknown User';
                    const email = profile?.email || request?.email || 'No Email Access'; // Auth email not accessible in fallback

                    // Determine Role
                    // If in user_roles, use that. If not, but in requests, use 'pending'. Else 'patient'.
                    let displayRole = 'patient';
                    if (role) {
                        displayRole = role;
                    } else if (request) {
                        displayRole = `pending-${request.requested_role}`;
                    }

                    return {
                        id: userId,
                        email,
                        full_name,
                        role: displayRole,
                        created_at: profile?.created_at || request?.created_at || new Date().toISOString(),
                        last_sign_in_at: null,
                        encrypted_password: null,
                        _source: 'fallback' as const
                    };
                });
            }
        },
    });

    const isFallbackMode = users.length > 0 && users[0]._source === 'fallback';

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("User ID copied to clipboard");
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-800 border-purple-200',
            doctor: 'bg-blue-100 text-blue-800 border-blue-200',
            nurse: 'bg-pink-100 text-pink-800 border-pink-200',
            cashier: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            receptionist: 'bg-orange-100 text-orange-800 border-orange-200',
            patient: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return <Badge variant="outline" className={colors[role] || colors.patient}>{role.toUpperCase()}</Badge>;
    };

    const filteredUsers = (users as AdminUser[]).filter((user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const patientUsers = filteredUsers.filter((user) => user.role === 'patient');
    const staffUsers = filteredUsers.filter((user) => user.role !== 'patient');

    const renderUserTable = (userList: AdminUser[]) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User / Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Security Status</TableHead>
                        <TableHead>Joined On</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Loading secure directory...
                            </TableCell>
                        </TableRow>
                    ) : userList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No users found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        userList.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.full_name || 'Unknown Name'}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getRoleBadge(user.role)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/30 px-3 py-2 rounded-md w-full max-w-[250px] justify-between border border-border/50">
                                        {user.encrypted_password ? (
                                            visiblePasswords[user.id] ? (
                                                <div className="flex flex-col w-full overflow-hidden">
                                                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider mb-1">SECURE HASH</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="font-mono text-[10px] sm:text-xs break-all leading-tight text-foreground/90 bg-background/50 p-1 rounded border border-border/50 max-h-[60px] overflow-y-auto w-full">
                                                            {user.encrypted_password}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 shrink-0"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.encrypted_password || "");
                                                                toast.success("Hash copied");
                                                            }}
                                                            title="Copy Full Hash"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-3 h-3 text-emerald-600" />
                                                    <span className="font-mono text-xs text-muted-foreground">●●●●●●●●●●●●●●●</span>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                <span title="Run the SQL fix above to enable access">Restricted Access</span>
                                            </span>
                                        )}

                                        {user.encrypted_password && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => togglePasswordVisibility(user.id)}
                                                className="hover:bg-background h-6 w-6 p-0 shrink-0 ml-1"
                                                title={visiblePasswords[user.id] ? "Hide Hash" : "View Hash"}
                                            >
                                                {visiblePasswords[user.id] ? (
                                                    <EyeOff className="w-3 h-3" />
                                                ) : (
                                                    <Eye className="w-3 h-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, hh:mm a') : (
                                        <span className="text-xs italic opacity-70">No Data</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleCopyId(user.id)} title="Copy User ID">
                                            <Copy className="w-4 h-4" />
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Set New Password">
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Set New Password</DialogTitle>
                                                    <DialogDescription>
                                                        You are setting a new password for <strong>{user.full_name}</strong>.
                                                        <br />
                                                        <span className="text-red-500 text-xs">Note: The old password cannot be recovered.</span>
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        const newPass = formData.get('newPassword') as string;

                                                        if (!newPass || newPass.length < 6) {
                                                            toast.error("Password must be at least 6 characters");
                                                            return;
                                                        }

                                                        try {
                                                            const { error } = await supabase.rpc('admin_reset_password', {
                                                                target_user_id: user.id,
                                                                new_password: newPass
                                                            });

                                                            if (error) throw error;
                                                            toast.success(`Password updated for ${user.full_name}`);
                                                            // Close dialog approach would need state, for simplicity we rely on form submission behavior or User closes
                                                            (e.target as HTMLFormElement).reset();
                                                        } catch (err: unknown) {
                                                            toast.error("Failed to reset: " + (err instanceof Error ? err.message : 'Unknown error'));
                                                        }
                                                    }}
                                                    className="space-y-4 pt-4"
                                                >
                                                    <div className="space-y-2">
                                                        <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                                                        <Input
                                                            id="newPassword"
                                                            name="newPassword"
                                                            type="text"
                                                            placeholder="Enter new password"
                                                            minLength={6}
                                                            required
                                                        />
                                                    </div>
                                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                                                        Update Password
                                                    </Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <DashboardLayout title="System Information" subtitle="User Directory & Compliance">
            {isFallbackMode && (
                <Alert variant="destructive" className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Limited Data Access</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            You are viewing a restricted version of the directory. "Last Login" and "Password Hash" are unavailable.
                        </span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="ml-4 h-8 bg-white border-yellow-300 hover:bg-yellow-100 text-yellow-900">
                                    <Terminal className="w-3 h-3 mr-2" /> Fix with SQL
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Enable Secure User Directory</DialogTitle>
                                    <DialogDescription>
                                        To view sensitive checks like Password Hashes and Last Login times, you must create a Secure RPC function in Supabase.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <p className="text-sm">Run this SQL in your Supabase Dashboard SQL Editor:</p>
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto relative group">
                                        <pre>{`-- Create Secure User Access Function
CREATE OR REPLACE FUNCTION get_all_users_secure()
RETURNS TABLE (
  id uuid,
  email text,
  encrypted_password text,
  role text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF is_admin THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email::text,
      au.encrypted_password::text,
      COALESCE(ur.role::text, 'patient') as role,
      COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name')::text, 'Unknown') as full_name,
      au.created_at,
      au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    LEFT JOIN public.profiles p ON au.id = p.user_id
    ORDER BY au.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access Denied';
  END IF;
END;
$$ LANGUAGE plpgsql;`}</pre>
                                        <Button
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => navigator.clipboard.writeText(`CREATE OR REPLACE FUNCTION get_all_users_secure()
RETURNS TABLE (
  id uuid,
  email text,
  encrypted_password text,
  role text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF is_admin THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email::text,
      au.encrypted_password::text,
      COALESCE(ur.role::text, 'patient') as role,
      COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name')::text, 'Unknown') as full_name,
      au.created_at,
      au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    LEFT JOIN public.profiles p ON au.id = p.user_id
    ORDER BY au.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access Denied';
  END IF;
END;
$$ LANGUAGE plpgsql;`)}
                                        >
                                            <Copy className="w-3 h-3" /> Copy
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        This function uses <code>SECURITY DEFINER</code> to allow admins to safely read from <code>auth.users</code>.
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </AlertDescription>
                </Alert>
            )}

            <Card className="mb-6 border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Shield className="w-5 h-5" /> Data Privacy & Security Notice
                    </CardTitle>
                    <CardDescription>
                        All user authentication data is secured.
                        {isFallbackMode ?
                            " Displaying public profile data only." :
                            " Secure Admin Access is active. You can view password hashes and login activity."}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="all">All Users</TabsTrigger>
                        <TabsTrigger value="patients">Patients</TabsTrigger>
                        <TabsTrigger value="staff">Staff</TabsTrigger>
                    </TabsList>

                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <TabsContent value="all" className="mt-0">
                            {renderUserTable(filteredUsers)}
                        </TabsContent>
                        <TabsContent value="patients" className="mt-0">
                            {renderUserTable(patientUsers)}
                        </TabsContent>
                        <TabsContent value="staff" className="mt-0">
                            {renderUserTable(staffUsers)}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </DashboardLayout>
    );
};

export default AdminInfo;
