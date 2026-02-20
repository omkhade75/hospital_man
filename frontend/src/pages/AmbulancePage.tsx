import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin, Phone, Plus, Loader2, CheckCircle2, Clock, User, Navigation, Wifi } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import {
    useAmbulances, useAmbulanceRequests, useAmbulanceRealtime,
    useCreateAmbulanceRequest, useUpdateAmbulanceRequest, useUpdateAmbulanceStatus, useUpsertAmbulance,
    type Ambulance, type AmbulanceStatus, type RequestStatus,
} from '@/hooks/useAmbulance';

// ── Status configs ────────────────────────────────────────────
const AMB_STATUS: Record<AmbulanceStatus, { label: string; cls: string; dot: string }> = {
    available: { label: 'Available', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-500' },
    busy: { label: 'Busy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' },
    offline: { label: 'Offline', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', dot: 'bg-gray-400' },
};

const REQ_STATUS: Record<RequestStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
    assigned: { label: 'Assigned', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    on_the_way: { label: 'On the Way', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    arrived: { label: 'Arrived', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

function timeElapsed(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`;
}

// ── Book Ambulance Modal (patient-facing) ────────────────────
function BookAmbulanceModal() {
    const [open, setOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [form, setForm] = useState({
        patient_name: '', phone: '', address: '', emergency_type: 'general',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
    });
    const create = useCreateAmbulanceRequest();

    const detectLocation = () => {
        setLocating(true);
        navigator.geolocation?.getCurrentPosition(
            pos => {
                setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                setLocating(false);
                toast.success('Location detected');
            },
            () => { setLocating(false); toast.error('Could not detect location. Enter address manually.'); },
            { timeout: 8000 }
        );
    };

    const handleSubmit = async () => {
        if (!form.patient_name || !form.phone) {
            toast.error('Name and phone are required');
            return;
        }
        await create.mutateAsync(form);
        setOpen(false);
        setForm({ patient_name: '', phone: '', address: '', emergency_type: 'general', latitude: undefined, longitude: undefined });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg">
                    <Truck className="h-4 w-4" /> Request Ambulance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Truck className="h-5 w-5" /> Request Emergency Ambulance
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Patient Name *</Label>
                            <Input placeholder="Full name" value={form.patient_name}
                                onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Phone *</Label>
                            <Input placeholder="+91 98765 43210" value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Emergency Type</Label>
                        <Select value={form.emergency_type} onValueChange={v => setForm(f => ({ ...f, emergency_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['cardiac', 'trauma', 'stroke', 'accident', 'fire', 'breathing', 'unconscious', 'general'].map(t => (
                                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Address</Label>
                        <Input placeholder="Enter pickup address" value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <Button variant="outline" className="w-full gap-2" onClick={detectLocation} disabled={locating}>
                        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-blue-500" />}
                        {locating ? 'Detecting…' : form.latitude ? `📍 ${form.latitude.toFixed(4)}, ${form.longitude?.toFixed(4)}` : 'Auto-Detect GPS Location'}
                    </Button>
                    <Button onClick={handleSubmit} disabled={create.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {create.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Dispatching…</> : '🚑 Dispatch Ambulance'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Add/Edit Ambulance Modal (admin) ─────────────────────────
function UpsertAmbulanceModal({ ambulance, onClose }: { ambulance?: Ambulance; onClose: () => void }) {
    const [form, setForm] = useState({
        driver_name: ambulance?.driver_name ?? '',
        driver_phone: ambulance?.driver_phone ?? '',
        vehicle_number: ambulance?.vehicle_number ?? '',
        status: (ambulance?.status ?? 'available') as AmbulanceStatus,
    });
    const upsert = useUpsertAmbulance();

    const handleSubmit = async () => {
        await upsert.mutateAsync({ ...(ambulance?.id ? { id: ambulance.id } : {}), ...form });
        onClose();
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{ambulance ? 'Edit Ambulance' : 'Add New Ambulance'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
                <div className="space-y-1">
                    <Label>Driver Name</Label>
                    <Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label>Driver Phone</Label>
                        <Input value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Vehicle Number</Label>
                        <Input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as AmbulanceStatus }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="available">✅ Available</SelectItem>
                            <SelectItem value="busy">🔴 Busy</SelectItem>
                            <SelectItem value="offline">⚫ Offline</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={upsert.isPending}>
                    {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {ambulance ? 'Save Changes' : 'Add Ambulance'}
                </Button>
            </div>
        </DialogContent>
    );
}

// ── Ambulance Card ────────────────────────────────────────────
function AmbulanceCard({ amb }: { amb: Ambulance }) {
    const [editOpen, setEditOpen] = useState(false);
    const updateStatus = useUpdateAmbulanceStatus();
    const cfg = AMB_STATUS[amb.status];

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${amb.status === 'available' ? 'bg-green-100 dark:bg-green-900/30' : amb.status === 'busy' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Truck className={`h-5 w-5 ${amb.status === 'available' ? 'text-green-600' : amb.status === 'busy' ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{amb.vehicle_number}</p>
                            <p className="text-xs text-muted-foreground">{amb.driver_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <Badge className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {amb.driver_phone}
                </div>
                {amb.current_latitude && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {amb.current_latitude.toFixed(4)}, {amb.current_longitude?.toFixed(4)}
                    </div>
                )}
                <div className="mt-3 flex gap-2">
                    {amb.status !== 'available' && (
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-green-700 border-green-300"
                            onClick={() => updateStatus.mutate({ id: amb.id, status: 'available' })}>
                            Set Available
                        </Button>
                    )}
                    {amb.status !== 'offline' && (
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-gray-600"
                            onClick={() => updateStatus.mutate({ id: amb.id, status: 'offline' })}>
                            Go Offline
                        </Button>
                    )}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2">Edit</Button>
                        </DialogTrigger>
                        <UpsertAmbulanceModal ambulance={amb} onClose={() => setEditOpen(false)} />
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Request Row ───────────────────────────────────────────────
function RequestRow({ req }: { req: ReturnType<typeof useAmbulanceRequests>['data'] extends (infer T)[] ? T : never }) {
    const update = useUpdateAmbulanceRequest();
    const s = REQ_STATUS[req.status];
    const active = !['completed', 'cancelled'].includes(req.status);
    const NEXT: Partial<Record<RequestStatus, RequestStatus>> = {
        assigned: 'on_the_way', on_the_way: 'arrived', arrived: 'completed',
    };

    return (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{req.patient_name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.phone}</span>
                        {req.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.address}</span>}
                        <span className="flex items-center gap-1 capitalize"><Truck className="h-3 w-3" />{req.emergency_type}</span>
                    </div>
                    {req.ambulances && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                            <Truck className="h-3 w-3" />{req.ambulances.vehicle_number} — {req.ambulances.driver_name}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${s.cls}`}>{s.label}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{timeElapsed(req.created_at)}
                    </span>
                </div>
                {active && NEXT[req.status] && (
                    <Button size="sm" className="h-7 text-xs"
                        onClick={() => update.mutate({ id: req.id, status: NEXT[req.status]! })}>
                        → {NEXT[req.status]?.replace('_', ' ')}
                    </Button>
                )}
                {active && req.status === 'pending' && (
                    <Button size="sm" variant="destructive" className="h-7 text-xs"
                        onClick={() => update.mutate({ id: req.id, status: 'cancelled' })}>Cancel</Button>
                )}
            </div>
        </div>
    );
}

// ── Main Ambulance Page ───────────────────────────────────────
export default function AmbulancePage() {
    const [addOpen, setAddOpen] = useState(false);
    const { data: ambulances = [], isLoading: ambLoading } = useAmbulances();
    const { data: requests = [], isLoading: reqLoading } = useAmbulanceRequests();

    const handleRTUpdate = useCallback(() => { }, []);
    useAmbulanceRealtime(handleRTUpdate);

    const available = ambulances.filter(a => a.status === 'available').length;
    const busy = ambulances.filter(a => a.status === 'busy').length;
    const pending = requests.filter(r => !['completed', 'cancelled'].includes(r.status)).length;

    return (
        <DashboardLayout title="Ambulance Management">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            Ambulance Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Real-time fleet dispatch & request tracking</p>
                    </div>
                    <div className="flex gap-3">
                        <BookAmbulanceModal />
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Ambulance
                                </Button>
                            </DialogTrigger>
                            <UpsertAmbulanceModal onClose={() => setAddOpen(false)} />
                        </Dialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Available', value: available, cls: 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
                        { label: 'On Mission', value: busy, cls: 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20', icon: <Truck className="h-5 w-5 text-red-500" /> },
                        { label: 'Active Requests', value: pending, cls: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20', icon: <Wifi className="h-5 w-5 text-blue-500" /> },
                    ].map(s => (
                        <Card key={s.label} className={`border ${s.cls}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-lg bg-background/60">{s.icon}</div>
                                    <span className="text-3xl font-bold">{s.value}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 font-medium">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="fleet">
                    <TabsList>
                        <TabsTrigger value="fleet">Fleet ({ambulances.length})</TabsTrigger>
                        <TabsTrigger value="requests" className="gap-1.5">
                            {pending > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            Requests ({requests.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Fleet */}
                    <TabsContent value="fleet" className="mt-4">
                        {ambLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {ambulances.map(a => <AmbulanceCard key={a.id} amb={a} />)}
                                {ambulances.length === 0 && (
                                    <Card className="col-span-4">
                                        <CardContent className="py-12 text-center">
                                            <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                            <p className="text-muted-foreground">No ambulances yet. Add your first vehicle above.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Requests */}
                    <TabsContent value="requests" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ambulance Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reqLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {requests.map(r => <RequestRow key={r.id} req={r} />)}
                                        {requests.length === 0 && (
                                            <div className="text-center py-12">
                                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                                                <p className="text-muted-foreground">No requests yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
