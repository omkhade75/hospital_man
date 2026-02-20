import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle, Heart, Siren, Stethoscope, Activity,
    Clock, User, Phone, Plus, CheckCircle2, Loader2,
    Zap, Flame, Brain, Bone, Droplets, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    useEmergencyCalls, useActiveEmergencies, useEmergencyRealtime,
    useCreateEmergency, useUpdateEmergencyStatus, useEmergencyDoctors,
    useAlertSound, type EmergencyCall, type EmergencyType, type EmergencyPriority, type EmergencyStatus,
} from '@/hooks/useEmergency';

// ── Helpers ───────────────────────────────────────────────────
const PRIORITY_CONFIG = {
    critical: { label: 'CRITICAL', cls: 'bg-red-600 text-white animate-pulse', ring: 'ring-2 ring-red-500', dot: 'bg-red-500' },
    high: { label: 'HIGH', cls: 'bg-orange-500 text-white', ring: 'ring-2 ring-orange-400', dot: 'bg-orange-500' },
    medium: { label: 'MEDIUM', cls: 'bg-yellow-500 text-black', ring: '', dot: 'bg-yellow-500' },
    low: { label: 'LOW', cls: 'bg-green-600 text-white', ring: '', dot: 'bg-green-500' },
};

const STATUS_CONFIG: Record<EmergencyStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
    assigned: { label: 'Assigned', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    in_progress: { label: 'In Progress', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    cardiac: <Heart className="h-5 w-5 text-red-500" />,
    stroke: <Brain className="h-5 w-5 text-purple-500" />,
    trauma: <Zap className="h-5 w-5 text-orange-500" />,
    accident: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    fire: <Flame className="h-5 w-5 text-red-600" />,
    breathing: <Activity className="h-5 w-5 text-blue-500" />,
    unconscious: <Siren className="h-5 w-5 text-pink-500" />,
    general: <Stethoscope className="h-5 w-5 text-gray-500" />,
};

const FIRST_AID_ICONS: Record<string, React.ReactNode> = {
    'heart-pulse': <Heart className="h-6 w-6" />,
    'droplets': <Droplets className="h-6 w-6" />,
    'flame': <Flame className="h-6 w-6" />,
    'brain': <Brain className="h-6 w-6" />,
    'bone': <Bone className="h-6 w-6" />,
    'activity': <Activity className="h-6 w-6" />,
};

const SEVERITY_COLOR: Record<string, string> = {
    critical: 'border-red-500/60 bg-red-950/30 dark:bg-red-950/20',
    high: 'border-orange-500/60 bg-orange-950/30 dark:bg-orange-950/20',
    medium: 'border-yellow-500/60 bg-yellow-950/20',
    low: 'border-green-500/60 bg-green-950/20',
};

function timeElapsed(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`;
}

// ── Create Emergency Modal ────────────────────────────────────
function CreateEmergencyModal() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        caller_number: '', patient_name: '',
        emergency_type: 'general' as EmergencyType,
        priority: 'high' as EmergencyPriority,
        notes: '',
    });
    const create = useCreateEmergency();

    const handleSubmit = async () => {
        await create.mutateAsync(form);
        setOpen(false);
        setForm({ caller_number: '', patient_name: '', emergency_type: 'general', priority: 'high', notes: '' });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg">
                    <Plus className="h-4 w-4" /> Log Emergency
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Siren className="h-5 w-5" /> Log New Emergency
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Caller Number</Label>
                            <Input placeholder="+91 98765 43210" value={form.caller_number}
                                onChange={e => setForm(f => ({ ...f, caller_number: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Patient Name</Label>
                            <Input placeholder="If known" value={form.patient_name}
                                onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Emergency Type</Label>
                            <Select value={form.emergency_type} onValueChange={v => setForm(f => ({ ...f, emergency_type: v as EmergencyType }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['cardiac', 'trauma', 'stroke', 'accident', 'fire', 'breathing', 'unconscious', 'general'].map(t => (
                                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Priority</Label>
                            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as EmergencyPriority }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">🔴 Critical</SelectItem>
                                    <SelectItem value="high">🟠 High</SelectItem>
                                    <SelectItem value="medium">🟡 Medium</SelectItem>
                                    <SelectItem value="low">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Notes</Label>
                        <Textarea placeholder="Additional details..." value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                    </div>
                    <Button onClick={handleSubmit} disabled={create.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {create.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : '🚨 Create Emergency'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Emergency Card ────────────────────────────────────────────
function EmergencyCard({ ec, onStatusChange }: { ec: EmergencyCall; onStatusChange: (id: string, status: EmergencyStatus) => void }) {
    const p = PRIORITY_CONFIG[ec.priority];
    const s = STATUS_CONFIG[ec.status];
    const active = ec.status !== 'completed' && ec.status !== 'cancelled';

    return (
        <div className={`rounded-xl border p-4 transition-all duration-300 ${p.ring} ${active ? 'bg-card' : 'bg-muted/30 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${ec.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
                        {TYPE_ICONS[ec.emergency_type] || TYPE_ICONS.general}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold capitalize text-foreground truncate">
                            {ec.emergency_type.replace('_', ' ')} Emergency
                        </p>
                        {ec.patient_name && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> {ec.patient_name}
                            </p>
                        )}
                        {ec.caller_number && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {ec.caller_number}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-xs font-bold ${p.cls}`}>{p.label}</Badge>
                    <Badge className={`text-xs ${s.cls}`}>{s.label}</Badge>
                </div>
            </div>

            {ec.doctors && (
                <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span><span className="font-medium text-foreground">{ec.doctors.name}</span> — {ec.doctors.specialization}</span>
                </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeElapsed(ec.created_at)}
                </span>
                {active && (
                    <div className="flex gap-1.5">
                        {ec.status === 'assigned' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-purple-700 border-purple-300"
                                onClick={() => onStatusChange(ec.id, 'in_progress')}>In Progress</Button>
                        )}
                        {(ec.status === 'assigned' || ec.status === 'in_progress') && (
                            <Button size="sm" className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700"
                                onClick={() => onStatusChange(ec.id, 'completed')}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                            </Button>
                        )}
                        {ec.status === 'pending' && (
                            <Button size="sm" variant="destructive" className="h-7 text-xs px-2"
                                onClick={() => onStatusChange(ec.id, 'cancelled')}>Cancel</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── First Aid Guide Card ──────────────────────────────────────
interface FirstAidGuide { id: string; title: string; description: string; category: string; steps: string[]; severity_level: string; icon: string; }

function FirstAidCard({ guide }: { guide: FirstAidGuide }) {
    const [expanded, setExpanded] = useState(false);
    const borderCls = SEVERITY_COLOR[guide.severity_level] || 'border-border';

    return (
        <div className={`rounded-xl border-2 p-5 transition-all duration-300 hover:shadow-lg cursor-pointer ${borderCls}`}
            onClick={() => setExpanded(e => !e)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${guide.severity_level === 'critical' ? 'bg-red-600/20 text-red-400' : 'bg-orange-600/20 text-orange-400'}`}>
                        {FIRST_AID_ICONS[guide.icon] || <Heart className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{guide.title}</h3>
                        <p className="text-xs text-muted-foreground">{guide.category}</p>
                    </div>
                </div>
                <Badge className={`text-xs uppercase font-bold ${PRIORITY_CONFIG[guide.severity_level as EmergencyPriority]?.cls || 'bg-gray-500 text-white'}`}>
                    {guide.severity_level}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{guide.description}</p>
            {expanded && (
                <ol className="mt-4 space-y-2">
                    {guide.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            <span className="text-foreground leading-relaxed">{step}</span>
                        </li>
                    ))}
                </ol>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-right italic">
                {expanded ? '▲ Collapse' : '▼ Tap to view steps'}
            </p>
        </div>
    );
}

// ── Main Emergency Dashboard Page ────────────────────────────
export default function EmergencyDashboard() {
    const [alertBanner, setAlertBanner] = useState<EmergencyCall | null>(null);
    const playAlert = useAlertSound();

    const { data: active = [], isLoading: activeLoading } = useActiveEmergencies();
    const { data: allCalls = [], isLoading: allLoading } = useEmergencyCalls();
    const { data: doctors = [] } = useEmergencyDoctors();
    const { data: firstAid = [] } = useQuery<FirstAidGuide[]>({
        queryKey: ['first-aid-guides'],
        queryFn: async () => {
            const { data, error } = await supabase.from('first_aid_guides').select('*').order('severity_level');
            if (error) throw error;
            return (data ?? []) as FirstAidGuide[];
        },
    });

    const updateStatus = useUpdateEmergencyStatus();

    const handleNew = useCallback((call: EmergencyCall) => {
        playAlert();
        setAlertBanner(call);
        setTimeout(() => setAlertBanner(null), 8000);
    }, [playAlert]);

    useEmergencyRealtime(handleNew);

    const handleStatusChange = (id: string, status: EmergencyStatus) => {
        updateStatus.mutate({ id, status });
    };

    const stats = {
        active: active.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length,
        critical: active.filter(e => e.priority === 'critical').length,
        pending: active.filter(e => e.status === 'pending').length,
        available: doctors.filter(d => d.is_available).length,
    };

    return (
        <DashboardLayout title="Emergency Command">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Alert Banner */}
                {alertBanner && (
                    <div className="fixed top-4 right-4 z-50 w-80 bg-red-600 text-white rounded-xl shadow-2xl p-4 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <Siren className="h-5 w-5 animate-bounce" /> NEW EMERGENCY ALERT
                        </div>
                        <p className="text-sm capitalize">{alertBanner.emergency_type} emergency — Priority: {alertBanner.priority.toUpperCase()}</p>
                        {alertBanner.patient_name && <p className="text-xs opacity-80 mt-1">Patient: {alertBanner.patient_name}</p>}
                        <Button size="sm" variant="secondary" className="mt-2 h-7 text-xs w-full"
                            onClick={() => setAlertBanner(null)}>Dismiss</Button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                                <Siren className="h-6 w-6 text-white" />
                            </div>
                            Emergency Command
                        </h1>
                        <p className="text-muted-foreground mt-1">Real-time emergency monitoring & response coordination</p>
                    </div>
                    <CreateEmergencyModal />
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Emergencies', value: stats.active, icon: <Activity className="h-5 w-5 text-red-500" />, cls: 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20' },
                        { label: 'Critical Cases', value: stats.critical, icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, cls: 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20' },
                        { label: 'Pending Triage', value: stats.pending, icon: <Clock className="h-5 w-5 text-yellow-500" />, cls: 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20' },
                        { label: 'Doctors Available', value: stats.available, icon: <Stethoscope className="h-5 w-5 text-green-500" />, cls: 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' },
                    ].map(s => (
                        <Card key={s.label} className={`border ${s.cls}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-lg bg-background/60">{s.icon}</div>
                                    <span className="text-3xl font-bold text-foreground">{s.value}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 font-medium">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="active" className="space-y-4">
                    <TabsList className="grid grid-cols-4 w-full max-w-lg">
                        <TabsTrigger value="active" className="gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${stats.active > 0 ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            Live ({stats.active})
                        </TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="firstaid">First Aid</TabsTrigger>
                        <TabsTrigger value="doctors">Doctors</TabsTrigger>
                    </TabsList>

                    {/* Active Emergencies */}
                    <TabsContent value="active" className="space-y-4">
                        {activeLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            </div>
                        ) : active.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-60" />
                                    <h3 className="font-semibold text-lg">No Active Emergencies</h3>
                                    <p className="text-muted-foreground text-sm">All clear. System is monitoring for incoming calls.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {active.map(ec => (
                                    <EmergencyCard key={ec.id} ec={ec} onStatusChange={handleStatusChange} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* History */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <RefreshCw className="h-4 w-4" /> Emergency Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {allLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                        {allCalls.map(ec => (
                                            <div key={ec.id} className={`flex items-center justify-between p-3 rounded-lg border ${ec.status === 'completed' ? 'opacity-60' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    {TYPE_ICONS[ec.emergency_type]}
                                                    <div>
                                                        <p className="text-sm font-medium capitalize">{ec.emergency_type} — {ec.patient_name || 'Unknown patient'}</p>
                                                        <p className="text-xs text-muted-foreground">{timeElapsed(ec.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-xs ${PRIORITY_CONFIG[ec.priority].cls}`}>{ec.priority}</Badge>
                                                    <Badge className={`text-xs ${STATUS_CONFIG[ec.status].cls}`}>{STATUS_CONFIG[ec.status].label}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {allCalls.length === 0 && (
                                            <p className="text-center text-muted-foreground py-8">No emergency records yet.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* First Aid Knowledge Base */}
                    <TabsContent value="firstaid">
                        <div className="grid md:grid-cols-2 gap-4">
                            {firstAid.map(g => <FirstAidCard key={g.id} guide={g} />)}
                            {firstAid.length === 0 && (
                                <Card className="col-span-2">
                                    <CardContent className="py-12 text-center">
                                        <p className="text-muted-foreground">Run the SQL migration to populate first aid guides.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Doctors Availability */}
                    <TabsContent value="doctors">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4" /> Doctor Availability
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {doctors.map(d => (
                                        <div key={d.id} className={`p-4 rounded-xl border flex items-center gap-3 ${d.is_available ? 'border-green-500/40 bg-green-50/30 dark:bg-green-950/20' : 'border-red-500/40 bg-red-50/30 dark:bg-red-950/20'}`}>
                                            <div className={`w-3 h-3 rounded-full ${d.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{d.name}</p>
                                                <p className="text-xs text-muted-foreground">{d.specialization}</p>
                                            </div>
                                            <span className={`ml-auto text-xs font-semibold ${d.is_available ? 'text-green-600' : 'text-red-500'}`}>
                                                {d.is_available ? 'Free' : 'Busy'}
                                            </span>
                                        </div>
                                    ))}
                                    {doctors.length === 0 && (
                                        <p className="text-muted-foreground text-sm col-span-3">No doctors in the system yet. Add doctors via Admin panel.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
