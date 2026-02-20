import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EmergencyStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type EmergencyPriority = 'critical' | 'high' | 'medium' | 'low';
export type EmergencyType = 'cardiac' | 'trauma' | 'stroke' | 'accident' | 'fire' | 'breathing' | 'unconscious' | 'general';

export interface EmergencyCall {
    id: string;
    caller_number: string | null;
    patient_name: string | null;
    emergency_type: EmergencyType;
    status: EmergencyStatus;
    priority: EmergencyPriority;
    assigned_doctor_id: string | null;
    notes: string | null;
    vapi_call_id: string | null;
    created_at: string;
    updated_at: string;
    doctors?: { name: string; specialization: string; phone: string | null } | null;
}

export interface EmergencyDoctor {
    id: string;
    name: string;
    specialization: string;
    phone: string | null;
    email: string | null;
    status: 'active' | 'inactive';
    is_available: boolean;
    created_at: string;
}

// ── Fetch all emergency calls ─────────────────────────────────
export function useEmergencyCalls() {
    return useQuery<EmergencyCall[]>({
        queryKey: ['emergency-calls'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_calls')
                .select('*, emergency_doctors(name, specialization, phone)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as EmergencyCall[];
        },
        refetchInterval: 15000,
    });
}

// ── Fetch active (non-completed) emergencies ──────────────────
export function useActiveEmergencies() {
    return useQuery<EmergencyCall[]>({
        queryKey: ['active-emergencies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_calls')
                .select('*, emergency_doctors(name, specialization, phone)')
                .not('status', 'in', '("completed","cancelled")')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as EmergencyCall[];
        },
        refetchInterval: 10000,
    });
}

// ── Realtime hook: subscribe to emergency_calls ───────────────
export function useEmergencyRealtime(onNew: (call: EmergencyCall) => void) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('emergency-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'emergency_calls' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['emergency-calls'] });
                    queryClient.invalidateQueries({ queryKey: ['active-emergencies'] });
                    if (payload.eventType === 'INSERT') {
                        onNew(payload.new as EmergencyCall);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient, onNew]);
}

// ── Create emergency (manual) ─────────────────────────────────
export function useCreateEmergency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            caller_number?: string;
            patient_name?: string;
            emergency_type: EmergencyType;
            priority: EmergencyPriority;
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('emergency_calls')
                .insert({ ...payload, status: 'pending' })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-calls'] });
            queryClient.invalidateQueries({ queryKey: ['active-emergencies'] });
            toast.success('Emergency created and routing initiated');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Update emergency status ───────────────────────────────────
export function useUpdateEmergencyStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, assigned_doctor_id }: {
            id: string;
            status: EmergencyStatus;
            assigned_doctor_id?: string;
        }) => {
            const update: Record<string, unknown> = { status };
            if (assigned_doctor_id !== undefined) update.assigned_doctor_id = assigned_doctor_id;

            // If completing, free the doctor
            if (status === 'completed' || status === 'cancelled') {
                const { data: ec } = await supabase
                    .from('emergency_calls').select('assigned_doctor_id').eq('id', id).single();
                if (ec?.assigned_doctor_id) {
                    await supabase.from('emergency_doctors').update({ is_available: true }).eq('id', ec.assigned_doctor_id);
                }
            }

            const { data, error } = await supabase
                .from('emergency_calls').update(update).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-calls'] });
            queryClient.invalidateQueries({ queryKey: ['active-emergencies'] });
            queryClient.invalidateQueries({ queryKey: ['emergency-doctors'] });
            toast.success('Emergency status updated');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Doctors for emergency use ─────────────────────────────────
export function useEmergencyDoctors() {
    return useQuery<EmergencyDoctor[]>({
        queryKey: ['emergency-doctors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_doctors')
                .select('*')
                .eq('status', 'active')
                .order('is_available', { ascending: false });
            if (error) throw error;
            return ((data ?? []) as unknown) as EmergencyDoctor[];
        },
        refetchInterval: 15000,
    });
}

// ── Toggle doctor availability ────────────────────────────────
export function useToggleDoctorAvailability() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
            const { data, error } = await supabase
                .from('emergency_doctors').update({ is_available }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-doctors'] });
            toast.success('Doctor availability updated');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Sound alert hook ──────────────────────────────────────────
export function useAlertSound() {
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playAlertSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContext();
            }
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.6);
        } catch {
            // Audio not supported
        }
    }, []);

    return playAlertSound;
}
