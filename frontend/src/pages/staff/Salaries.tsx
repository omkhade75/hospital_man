import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Banknote, Save, X, Edit2, AlertTriangle, Terminal, Copy, Trash2, RefreshCw, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    salary: number;
    salary_record_id?: string;
}

const Salaries = () => {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<string>('');
    const [tableMissing, setTableMissing] = useState(false);

    const { data: staffList = [], isLoading } = useQuery({
        queryKey: ['staff-salaries'],
        queryFn: async () => {
            // 1. Fetch Users & Roles
            const { data: profiles } = await supabase.from('profiles').select('*');
            const { data: roles } = await supabase.from('user_roles').select('*');
            const { data: requests } = await supabase.from('staff_approval_requests').select('*');

            // 2. Fetch Salaries (Handle error if table doesn't exist)
            let salaries: Array<{ id: string; user_id: string; salary: number }> = [];
            try {
                const { data, error } = await supabase.from('staff_salaries').select('*');
                if (error) {
                    if (error.code === '42P01') { // undefined_table
                        setTableMissing(true);
                    }
                    throw error;
                }
                salaries = data || [];
            } catch (err) {
                console.warn("Could not fetch salaries:", err);
                if (err && typeof err === 'object' && 'code' in err && err.code === '42P01') setTableMissing(true);
            }

            const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
            const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
            const requestMap = new Map((requests || []).map((r) => [r.user_id, r]));
            const salaryMap = new Map(salaries.map((s) => [s.user_id, s]));

            const allUserIds = new Set([
                ...(profiles || []).map((p) => p.user_id),
                ...(roles || []).map((r) => r.user_id),
                ...(requests || []).map((r) => r.user_id)
            ]);

            const staff: StaffMember[] = [];

            allUserIds.forEach(userId => {
                const role = roleMap.get(userId);
                const request = requestMap.get(userId);

                // Filter for staff only (has role or request)
                if (!role && !request) return;
                if (role === 'patient') return;

                const profile = profileMap.get(userId);
                const salaryRecord = salaryMap.get(userId);

                const name = profile?.full_name || request?.full_name || 'Unknown Staff';
                const email = profile?.email || request?.email || 'No Email';

                const displayRole = role || (request ? `pending-${request.requested_role}` : 'unknown');

                staff.push({
                    id: userId,
                    name,
                    email,
                    role: displayRole,
                    salary: salaryRecord?.salary || 0,
                    salary_record_id: salaryRecord?.id
                });
            });

            return staff;
        },
    });

    const updateSalaryMutation = useMutation({
        mutationFn: async ({ userId, salary }: { userId: string; salary: number }) => {
            // Upsert salary
            // We need to know if we are inserting or updating, but upsert with unique key works best
            // Since we defined user_id as unique, we can use upsert
            const { error } = await supabase
                .from('staff_salaries')
                .upsert({
                    user_id: userId,
                    salary: salary,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Salary updated successfully');
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ['staff-salaries'] });
        },
        onError: (error: Error) => {
            toast.error('Failed to update salary: ' + error.message);
        },
    });

    const deleteStaffMutation = useMutation({
        mutationFn: async (userId: string) => {
            // Delete from multiple tables to remove staff access
            // Note: This does not delete from auth.users (requires secure RPC), but removes all staff privileges

            // 1. Delete Salary Record
            if (!tableMissing) {
                await supabase.from('staff_salaries').delete().eq('user_id', userId);
            }

            // 2. Delete Role (Revokes access)
            await supabase.from('user_roles').delete().eq('user_id', userId);

            // 3. Delete Request
            await supabase.from('staff_approval_requests').delete().eq('user_id', userId);

            // 4. (Optional) We could delete profile, but usually good to keep for history if needed.
            // For "Delete from database" requests, we usually assume wiping their staff existence.
            // Let's delete profile too to be thorough as per user request
            await supabase.from('profiles').delete().eq('user_id', userId);
        },
        onSuccess: () => {
            toast.success('Staff member removed successfully');
            queryClient.invalidateQueries({ queryKey: ['staff-salaries'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-directory'] });
        },
        onError: (error: Error) => {
            toast.error('Failed to remove staff member: ' + error.message);
        }
    });

    const handleEdit = (staff: StaffMember) => {
        setEditingId(staff.id);
        setEditAmount(staff.salary.toString());
    };

    const handleSave = (userId: string) => {
        updateSalaryMutation.mutate({ userId, salary: parseFloat(editAmount) || 0 });
    };

    const handleExportPDF = () => {
        if (!staffList.length) {
            toast.warning("No data to export");
            return;
        }

        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.setTextColor(0, 128, 0); // Green color
        doc.text("Star Hospital - Staff Directory", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Define Table Columns and Data
        const tableColumn = ["Name", "Email", "Role", "Monthly Salary"];
        const tableRows: Array<Array<string>> = [];

        staffList.forEach((staff) => {
            const staffData = [
                staff.name,
                staff.email,
                staff.role.toUpperCase(),
                `Rs. ${staff.salary.toLocaleString()}`
            ];
            tableRows.push(staffData);
        });

        // Generate Table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] }, // Green-600
        });

        // Save PDF
        doc.save("star_hospital_staff_list.pdf");
        toast.success("Staff list exported to PDF");
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-800 border-purple-200',
            doctor: 'bg-blue-100 text-blue-800 border-blue-200',
            nurse: 'bg-pink-100 text-pink-800 border-pink-200',
            cashier: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            receptionist: 'bg-orange-100 text-orange-800 border-orange-200',
        };
        const baseRole = role.replace('pending-', '') as string;
        const color = colors[baseRole] || 'bg-gray-100 text-gray-800 border-gray-200';
        return <Badge variant="outline" className={color}>{role.toUpperCase()}</Badge>;
    };

    return (
        <DashboardLayout title="Staff Salaries" subtitle="Manage salaries for all staff members">
            {tableMissing && (
                <Alert variant="destructive" className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Salary Database Missing</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            The "staff_salaries" table does not exist. You cannot save salaries until this table is created.
                        </span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="ml-4 h-8 bg-white border-yellow-300 hover:bg-yellow-100 text-yellow-900">
                                    <Terminal className="w-3 h-3 mr-2" /> Fix with SQL
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Salaries Table</DialogTitle>
                                    <DialogDescription>
                                        Run this SQL in your Supabase Dashboard to create the necessary table.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto relative group">
                                        <pre>{`CREATE TABLE IF NOT EXISTS public.staff_salaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    salary numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salaries" ON public.staff_salaries
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );`}</pre>
                                        <Button
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.staff_salaries...`)}
                                        >
                                            <Copy className="w-3 h-3" /> Copy
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="h-6 w-6 text-green-600" />
                            Staff Payroll
                        </CardTitle>
                        <CardDescription>
                            Total Monthly Payroll: ₹{staffList.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}
                        </CardDescription>
                    </div>
                    <Button onClick={handleExportPDF} variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
                        <FileText className="h-4 w-4" /> Export PDF
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Monthly Salary</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No staff members found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staffList.map((staff) => (
                                    <TableRow key={staff.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{staff.name}</span>
                                                <span className="text-xs text-muted-foreground">{staff.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(staff.role)}</TableCell>
                                        <TableCell className="text-right">
                                            {editingId === staff.id ? (
                                                <Input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-32"
                                                    placeholder="₹ 0"
                                                />
                                            ) : (
                                                <span className={staff.salary > 0 ? "font-medium" : "text-muted-foreground italic"}>
                                                    {staff.salary > 0 ? `₹${staff.salary.toLocaleString()}` : 'Not Set'}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {editingId === staff.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => handleSave(staff.id)} className="h-8 w-8 p-0 text-green-600">
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 text-destructive">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Manage Credentials">
                                                                <RefreshCw className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Reset Staff Password</DialogTitle>
                                                                <DialogDescription>
                                                                    Set a new password for <strong>{staff.name}</strong>.
                                                                    <br />
                                                                    <span className="text-red-500 text-xs">This will immediately invalidate their old password.</span>
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
                                                                            target_user_id: staff.id,
                                                                            new_password: newPass
                                                                        });

                                                                        if (error) throw error;
                                                                        toast.success(`Password updated for ${staff.name}`);
                                                                        (e.target as HTMLFormElement).reset();
                                                                    } catch (err) {
                                                                        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                                                                        toast.error("Failed to reset: " + errorMessage);
                                                                    }
                                                                }}
                                                                className="space-y-4 pt-4"
                                                            >
                                                                <div className="space-y-2">
                                                                    <label htmlFor="staffNewPassword" className="text-sm font-medium">New Password</label>
                                                                    <Input
                                                                        id="staffNewPassword"
                                                                        name="newPassword"
                                                                        type="text"
                                                                        placeholder="Enter new password"
                                                                        minLength={6}
                                                                        required
                                                                    />
                                                                </div>
                                                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                                    Update Password
                                                                </Button>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(staff)} className="h-8 w-8 p-0" disabled={tableMissing}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will remove <strong>{staff.name}</strong> from the staff directory and revoke their access.
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteStaffMutation.mutate(staff.id)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    Remove Staff
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default Salaries;
