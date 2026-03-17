import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Phone, Heart, Flame, Brain, Bone, Droplets, Activity,
    Siren, ChevronDown, ChevronUp, ArrowLeft, Ambulance,
    AlertTriangle, ShieldCheck, Clock, MapPin, PlayCircle,
} from 'lucide-react';
import { useMurfAI } from '@/hooks/useMurfAI';

// ── First Aid Guides (static – no DB needed on public page) ───
const FIRST_AID_GUIDES = [
    {
        id: 'cardiac', title: 'Cardiac Arrest', category: 'Cardiac', icon: Heart,
        severity: 'critical', color: 'red',
        description: 'Sudden loss of heart function. Every second counts — begin CPR immediately.',
        steps: [
            'Call emergency services (112 / 108) immediately',
            'Lay person flat on back on a firm surface',
            'Place heel of hand on centre of chest; push hard & fast (100–120/min)',
            'Give 2 rescue breaths after every 30 compressions if trained',
            'Use AED as soon as available — follow its voice prompts',
            'Continue until help arrives or person regains consciousness',
        ],
    },
    {
        id: 'bleeding', title: 'Severe Bleeding', category: 'Trauma', icon: Droplets,
        severity: 'critical', color: 'red',
        description: 'Uncontrolled bleeding is life-threatening. Act fast to stop blood loss.',
        steps: [
            'Wear gloves if available to protect yourself',
            'Apply firm, direct pressure using a clean cloth or bandage',
            'Do NOT remove the cloth if soaked — add more material on top',
            'Elevate the wound above heart level if possible',
            'Apply a tourniquet 2–3 inches above the wound for limb bleeding',
            'Keep person warm and call 108 if bleeding is severe',
        ],
    },
    {
        id: 'stroke', title: 'Stroke — FAST', category: 'Neurological', icon: Brain,
        severity: 'critical', color: 'purple',
        description: 'Use the FAST test to identify a stroke in seconds.',
        steps: [
            'F – Face: Ask to smile. Does one side droop?',
            'A – Arms: Ask to raise both arms. Does one drift down?',
            'S – Speech: Ask to repeat a sentence. Is it slurred?',
            'T – Time: Call 112 immediately if ANY sign is present',
            'Note the exact time symptoms started — crucial for treatment',
            'Do NOT give food, water, or medication. Keep still until help arrives',
        ],
    },
    {
        id: 'burns', title: 'Burns', category: 'Burns', icon: Flame,
        severity: 'high', color: 'orange',
        description: 'Cool, cover, and seek help for moderate to severe burns.',
        steps: [
            'Remove person from the burn source safely',
            'Run cool (not cold) water over burn for 10–20 minutes',
            'Remove jewellery near the burn area carefully',
            'Cover loosely with sterile dressing — do NOT use ice or butter',
            'Do NOT pop blisters',
            'Seek medical care for burns larger than a palm or on face/hands/joints',
        ],
    },
    {
        id: 'fracture', title: 'Fracture / Broken Bone', category: 'Orthopaedic', icon: Bone,
        severity: 'high', color: 'yellow',
        description: 'Immobilise the injured area and prevent further damage.',
        steps: [
            'Do NOT try to straighten a broken bone',
            'Immobilise the area using a splint or firm padding',
            'Apply a cold pack wrapped in cloth to reduce swelling',
            'Elevate the limb if possible',
            'Control bleeding with gentle pressure around (not on) the fracture',
            'Call 108 for open fractures, spinal injuries, or severe pain',
        ],
    },
    {
        id: 'unconscious', title: 'Unconsciousness', category: 'General', icon: Activity,
        severity: 'critical', color: 'red',
        description: 'An unconscious person needs immediate assessment and support.',
        steps: [
            'Tap their shoulder and shout "Are you OK?"',
            'Call 112 immediately if no response',
            'Tilt their head back gently and lift the chin to open airway',
            'Check for breathing for no more than 10 seconds',
            'If not breathing normally, start CPR immediately',
            'If breathing, roll them into recovery position (on their side)',
            'Monitor until emergency services arrive',
        ],
    },
];

// ── First Aid Videos from YouTube ─────────────────────────────
const FIRST_AID_VIDEOS = [
    {
        id: 'v1', title: 'How to Perform CPR', category: 'Cardiac',
        thumb: 'https://img.youtube.com/vi/cosVBV96E2g/hqdefault.jpg',
        videoId: 'cosVBV96E2g',
        duration: '3:45',
    },
    {
        id: 'v2', title: 'Stop Severe Bleeding — First Aid', category: 'Trauma',
        thumb: 'https://img.youtube.com/vi/NxO5LvgqZe0/hqdefault.jpg',
        videoId: 'NxO5LvgqZe0',
        duration: '2:58',
    },
    {
        id: 'v3', title: 'Recognising a Stroke — FAST', category: 'Neurological',
        thumb: 'https://img.youtube.com/vi/_BbVCHKEuK8/hqdefault.jpg',
        videoId: '_BbVCHKEuK8',
        duration: '2:12',
    },
    {
        id: 'v4', title: 'First Aid for Burns', category: 'Burns',
        thumb: 'https://img.youtube.com/vi/TJjJhRJA4to/hqdefault.jpg',
        videoId: 'TJjJhRJA4to',
        duration: '3:10',
    },
    {
        id: 'v5', title: 'How to Treat a Fracture', category: 'Orthopaedic',
        thumb: 'https://img.youtube.com/vi/Q7BPQMK4FGE/hqdefault.jpg',
        videoId: 'Q7BPQMK4FGE',
        duration: '4:02',
    },
    {
        id: 'v6', title: 'Choking — Heimlich Manoeuvre', category: 'Airway',
        thumb: 'https://img.youtube.com/vi/PA9hpOnvtCk/hqdefault.jpg',
        videoId: 'PA9hpOnvtCk',
        duration: '2:33',
    },
];

const SEVERITY_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
    critical: {
        border: 'border-red-500/50 bg-red-950/20 dark:bg-red-950/30',
        badge: 'bg-red-600 text-white animate-pulse',
        icon: 'bg-red-600/20 text-red-400',
    },
    high: {
        border: 'border-orange-500/50 bg-orange-950/10',
        badge: 'bg-orange-500 text-white',
        icon: 'bg-orange-600/20 text-orange-400',
    },
};

// ── First Aid Card ────────────────────────────────────────────
function FirstAidCard({ guide }: { guide: typeof FIRST_AID_GUIDES[0] }) {
    const [open, setOpen] = useState(false);
    const s = SEVERITY_STYLES[guide.severity];
    const Icon = guide.icon;
    return (
        <div
            className={`rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-xl ${s.border}`}
            onClick={() => setOpen(o => !o)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${s.icon}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">{guide.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{guide.category}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs font-bold uppercase ${s.badge}`}>{guide.severity}</Badge>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{guide.description}</p>
            {open && (
                <ol className="mt-5 space-y-2.5">
                    {guide.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-foreground leading-relaxed">{step}</span>
                        </li>
                    ))}
                </ol>
            )}
            <p className="text-xs text-muted-foreground mt-4 text-right italic">
                {open ? '▲ Tap to collapse' : '▼ Tap to expand steps'}
            </p>
        </div>
    );
}

// ── Video Card ────────────────────────────────────────────────
function VideoCard({ v }: { v: typeof FIRST_AID_VIDEOS[0] }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all duration-300 group">
            <div className="relative aspect-video bg-black">
                {playing ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : (
                    <>
                        <img src={v.thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <button
                                onClick={() => setPlaying(true)}
                                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-200"
                            >
                                <PlayCircle className="h-8 w-8 text-white" />
                            </button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{v.duration}</div>
                    </>
                )}
            </div>
            <div className="p-4">
                <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 mb-2">{v.category}</Badge>
                <h4 className="font-semibold text-foreground text-sm leading-snug">{v.title}</h4>
            </div>
        </div>
    );
}

// ── Ambulance Request Modal ───────────────────────────────────
function AmbulanceModal() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ patient_name: '', phone: '', address: '', emergency_type: 'general' });
    const { speak } = useMurfAI();

    const req = useMutation({
        mutationFn: async () => {
            if (!form.patient_name || !form.phone) throw new Error('Name and phone are required');
            const { error } = await supabase.from('ambulance_requests').insert({
                ...form, status: 'pending',
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('🚑 Ambulance dispatched! Help is on the way.');
            setOpen(false);
            setForm({ patient_name: '', phone: '', address: '', emergency_type: 'general' });
            // 🔊 Murf AI calming voice after ambulance booking
            speak({
                text: `Please stay calm, ${form.patient_name || 'your request has been received'}. Help is on the way. An ambulance has been dispatched to your location. Keep yourself safe and breathe slowly. Our team will reach you as soon as possible. If the situation worsens, please call 112 immediately.`,
                voiceId: 'en-US-natalie',
                rate: 0.9,
                pitch: 0,
            });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white gap-3 h-14 px-8 text-lg shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 transition-all duration-200">
                    <Ambulance className="h-6 w-6" />
                    Request Ambulance Now
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Ambulance className="h-5 w-5" /> Request Emergency Ambulance
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label>Patient Name *</Label>
                        <Input placeholder="Full name" value={form.patient_name}
                            onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Contact Phone *</Label>
                        <Input placeholder="+91 98765 43210" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Address / Location</Label>
                        <Input placeholder="Street, area, landmark" value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Emergency Type</Label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.emergency_type}
                            onChange={e => setForm(f => ({ ...f, emergency_type: e.target.value }))}
                        >
                            {['cardiac', 'trauma', 'stroke', 'accident', 'fire', 'breathing', 'unconscious', 'general'].map(t => (
                                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={() => req.mutate()} disabled={req.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white h-11 text-base">
                        {req.isPending ? 'Submitting…' : '🚑 Confirm Emergency Request'}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">For life-threatening emergencies, also call <strong>112</strong> or <strong>108</strong> directly.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PublicEmergency() {
    return (
        <div className="min-h-screen bg-background font-sans">

            {/* ── Sticky Alert Bar ── */}
            <div className="bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-3">
                <Siren className="h-4 w-4 animate-bounce" />
                <span>EMERGENCY HOTLINE: <strong>112</strong> (All India) &nbsp;|&nbsp; Ambulance: <strong>108</strong> &nbsp;|&nbsp; Hospital: <strong>+91 98765 43210</strong></span>
                <Siren className="h-4 w-4 animate-bounce" />
            </div>

            {/* ── Header ── */}
            <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/30">
                            <Siren className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-foreground">Emergency Centre</span>
                    </div>
                    <Link to="/patient/login">
                        <Button variant="outline" size="sm" className="gap-1.5">Patient Login</Button>
                    </Link>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="relative bg-gradient-to-br from-red-950 via-gray-950 to-gray-900 py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504813184591-01572f98c85f?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/80" />
                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
                    <div className="flex justify-center">
                        <div className="flex items-center gap-3 px-6 py-3 bg-red-600/20 border border-red-500/40 rounded-full backdrop-blur-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-red-300 font-semibold text-sm uppercase tracking-wider">24 / 7 Emergency Response</span>
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                        Emergency <span className="text-red-400">Help</span><br />Is Here
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Access first-aid guides, watch emergency response videos, and request an ambulance instantly — no login required.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                        <AmbulanceModal />
                        <a href="tel:112">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10 gap-3 transition-all duration-200">
                                <Phone className="h-5 w-5" /> Call 112 Now
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Quick Emergency Numbers ── */}
            <section className="py-12 px-4 bg-card border-b border-border">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-xl font-bold text-center mb-8 text-muted-foreground uppercase tracking-widest text-sm">Emergency Contacts</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'All Emergencies', number: '112', icon: Siren, color: 'bg-red-600' },
                            { label: 'Ambulance', number: '108', icon: Ambulance, color: 'bg-orange-600' },
                            { label: 'Police', number: '100', icon: ShieldCheck, color: 'bg-blue-600' },
                            { label: 'Hospital Direct', number: '+91 98765 43210', icon: Phone, color: 'bg-green-600' },
                        ].map(c => {
                            const Icon = c.icon;
                            return (
                                <a key={c.number} href={`tel:${c.number.replace(/\s+/g, '')}`}>
                                    <Card className="hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border-border">
                                        <CardContent className="p-5 text-center space-y-3">
                                            <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center mx-auto shadow-lg`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-black text-2xl text-foreground">{c.number}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── First Aid Video Library ── */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="text-center space-y-3">
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 uppercase tracking-wider font-semibold">
                            Video Library
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold">First Aid Video Guides</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">Learn life-saving techniques from certified medical professionals. Click any video to play.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FIRST_AID_VIDEOS.map(v => <VideoCard key={v.id} v={v} />)}
                    </div>
                </div>
            </section>

            {/* ── First Aid Guide Cards ── */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="text-center space-y-3">
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 uppercase tracking-wider font-semibold">
                            Step-by-Step Guides
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold">Emergency First Aid Protocols</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">Tap any card to expand detailed step-by-step instructions.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                        {FIRST_AID_GUIDES.map(g => <FirstAidCard key={g.id} guide={g} />)}
                    </div>
                </div>
            </section>

            {/* ── Quick Tips Banner ── */}
            <section className="py-14 px-4 bg-gradient-to-r from-red-600 to-red-800 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-3xl font-bold">In Any Emergency — Remember This</h2>
                        <p className="text-red-100 text-lg">The golden rules that save lives.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Phone, label: 'Call First', tip: 'Dial 112 or 108 before anything else' },
                            { icon: ShieldCheck, label: 'Stay Safe', tip: 'Do not put yourself in danger' },
                            { icon: Clock, label: 'Act Quickly', tip: 'Minutes matter in cardiac / stroke emergencies' },
                            { icon: MapPin, label: 'Know Your Location', tip: 'Share your exact address with dispatch' },
                        ].map(t => {
                            const Icon = t.icon;
                            return (
                                <div key={t.label} className="text-center space-y-3 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg">{t.label}</h3>
                                    <p className="text-red-100 text-sm leading-relaxed">{t.tip}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA Footer ── */}
            <section className="py-12 px-4 bg-card border-t border-border text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <h3 className="text-xl font-bold">Need professional medical care?</h3>
                </div>
                <p className="text-muted-foreground max-w-lg mx-auto">Book an appointment or log in to access your patient portal and connect with our doctors.</p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                    <Link to="/patient/register">
                        <Button size="lg" className="gap-2 shadow-lg">Book Appointment</Button>
                    </Link>
                    <Link to="/patient/login">
                        <Button size="lg" variant="outline" className="gap-2">Patient Login</Button>
                    </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    © 2026 Medicare Hospital · Emergency Centre · <a href="tel:112" className="text-red-500 font-bold">112</a>
                </p>
            </section>
        </div>
    );
}
