import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Stethoscope, Plus, Pencil, Trash2, Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useToggleDoctorAvailability, type EmergencyDoctor } from '@/hooks/useEmergency';

const SPECIALIZATIONS = [
    'Emergency Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
    'General Surgery', 'Pediatrics', 'Pulmonology', 'Internal Medicine',
    'Oncology', 'Radiology', 'Dermatology', 'Psychiatry', 'Urology',
    'Ophthalmology', 'ENT', 'Anesthesiology', 'Gynecology', 'General Practice',
];

interface DoctorForm {
    name: string;
    specialization: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
    is_available: boolean;
}

const EMPTY_FORM: DoctorForm = {
    name: '', specialization: 'Emergency Medicine', phone: '', email: '',
    status: 'active', is_available: true,
};

// ── Doctor form modal ─────────────────────────────────────────
function DoctorFormModal({
    doctor, open, onClose,
}: { doctor?: EmergencyDoctor; open: boolean; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState<DoctorForm>(
        doctor
            ? { name: doctor.name, specialization: doctor.specialization, phone: doctor.phone ?? '', email: doctor.email ?? '', status: doctor.status, is_available: doctor.is_available }
            : EMPTY_FORM
    );

    const mutation = useMutation({
        mutationFn: async (data: DoctorForm) => {
            if (doctor?.id) {
                const { error } = await supabase.from('emergency_doctors').update(data).eq('id', doctor.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('emergency_doctors').insert(data);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['all-doctors-admin'] });
            qc.invalidateQueries({ queryKey: ['emergency-doctors'] });
            toast.success(doctor ? 'Doctor updated' : 'Doctor added');
            onClose();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    {doctor ? 'Edit Doctor' : 'Add New Doctor'}
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
                <div className="space-y-1">
                    <Label>Full Name *</Label>
                    <Input placeholder="Dr. John Smith" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                    <Label>Specialization *</Label>
                    <Select value={form.specialization} onValueChange={v => setForm(f => ({ ...f, specialization: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input placeholder="+91 98765 43210" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input placeholder="doctor@hospital.com" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'active' | 'inactive' }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">✅ Active</SelectItem>
                                <SelectItem value="inactive">⚫ Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                        <Label>Available for Emergencies</Label>
                        <Switch checked={form.is_available}
                            onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
                    </div>
                </div>
                <Button className="w-full" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.specialization}>
                    {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : (doctor ? 'Save Changes' : 'Add Doctor')}
                </Button>
            </div>
        </DialogContent>
    );
}

// ── Main Doctor Management Page ───────────────────────────────
export default function DoctorManagement() {
    const [search, setSearch] = useState('');
    const [filterAvail, setFilterAvail] = useState<'all' | 'available' | 'busy'>('all');
    const [addOpen, setAddOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<EmergencyDoctor | null>(null);
    const qc = useQueryClient();
    const toggleAvail = useToggleDoctorAvailability();

    const { data: doctors = [], isLoading } = useQuery<EmergencyDoctor[]>({
        queryKey: ['all-doctors-admin'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_doctors').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return (data as unknown) as EmergencyDoctor[];
        },
    });

    const deleteDoctor = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('emergency_doctors').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['all-doctors-admin'] });
            qc.invalidateQueries({ queryKey: ['emergency-doctors'] });
            toast.success('Doctor removed');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const filtered = doctors.filter(d => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.specialization.toLowerCase().includes(search.toLowerCase());
        const matchAvail =
            filterAvail === 'all' ? true :
                filterAvail === 'available' ? d.is_available :
                    !d.is_available;
        return matchSearch && matchAvail;
    });

    const total = doctors.length;
    const active = doctors.filter(d => d.status === 'active').length;
    const avail = doctors.filter(d => d.is_available && d.status === 'active').length;

    return (
        <DashboardLayout title="Doctor Management">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            Doctor Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Admin-controlled doctor registry with emergency routing</p>
                    </div>
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-lg">
                                <Plus className="h-4 w-4" /> Add Doctor
                            </Button>
                        </DialogTrigger>
                        <DoctorFormModal open={addOpen} onClose={() => setAddOpen(false)} />
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Doctors', value: total, icon: <Stethoscope className="h-4 w-4 text-blue-500" />, cls: '' },
                        { label: 'Active', value: active, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, cls: 'border-green-500/30 bg-green-50/30 dark:bg-green-950/20' },
                        { label: 'Available Now', value: avail, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, cls: 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20' },
                    ].map(s => (
                        <Card key={s.label} className={`border ${s.cls}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-lg bg-muted">{s.icon}</div>
                                    <span className="text-3xl font-bold">{s.value}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 font-medium">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Search by name or specialization…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Select value={filterAvail} onValueChange={v => setFilterAvail(v as typeof filterAvail)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Doctors</SelectItem>
                            <SelectItem value="available">✅ Available</SelectItem>
                            <SelectItem value="busy">🔴 Busy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Doctors Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(doc => (
                            <Card key={doc.id} className={`hover:shadow-md transition-shadow ${doc.status === 'inactive' ? 'opacity-60' : ''}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                        ${doc.is_available && doc.status === 'active' ? 'bg-green-500' : doc.status === 'inactive' ? 'bg-gray-400' : 'bg-red-500'}`}>
                                                {doc.name.charAt(3).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground leading-tight">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className={`text-xs ${doc.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600'}`}>
                                                {doc.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {doc.phone && (
                                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                                            📞 {doc.phone}
                                        </p>
                                    )}
                                    {doc.email && (
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                            ✉️ {doc.email}
                                        </p>
                                    )}

                                    {/* Availability Toggle */}
                                    {doc.status === 'active' && (
                                        <div className="mt-4 flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                {doc.is_available
                                                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    : <XCircle className="h-4 w-4 text-red-500" />}
                                                <span className="text-xs font-medium">{doc.is_available ? 'Available for emergencies' : 'Currently busy'}</span>
                                            </div>
                                            <Switch
                                                checked={doc.is_available}
                                                onCheckedChange={v => toggleAvail.mutate({ id: doc.id, is_available: v })}
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-3 flex gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs"
                                                    onClick={() => setEditTarget(doc)}>
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </Button>
                                            </DialogTrigger>
                                            {editTarget?.id === doc.id && (
                                                <DoctorFormModal doctor={doc} open={true} onClose={() => setEditTarget(null)} />
                                            )}
                                        </Dialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {doc.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently remove this doctor from the system. Active emergency assignments will lose this doctor.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => deleteDoctor.mutate(doc.id)}>
                                                        {deleteDoctor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filtered.length === 0 && (
                            <Card className="col-span-3">
                                <CardContent className="py-12 text-center">
                                    <Stethoscope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="font-semibold">No doctors found</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        {search ? 'Try a different search term.' : 'Add your first doctor using the button above.'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
