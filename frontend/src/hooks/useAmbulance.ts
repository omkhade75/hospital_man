import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AmbulanceStatus = 'available' | 'busy' | 'offline';
export type RequestStatus = 'pending' | 'assigned' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled';

export interface Ambulance {
    id: string;
    driver_name: string;
    driver_phone: string;
    vehicle_number: string;
    status: AmbulanceStatus;
    current_latitude: number | null;
    current_longitude: number | null;
    created_at: string;
    updated_at: string;
}

export interface AmbulanceRequest {
    id: string;
    patient_name: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    emergency_type: string;
    status: RequestStatus;
    assigned_ambulance_id: string | null;
    created_at: string;
    updated_at: string;
    ambulances?: { driver_name: string; vehicle_number: string; driver_phone: string } | null;
}

export interface AmbulanceTracking {
    id: string;
    ambulance_id: string;
    latitude: number;
    longitude: number;
    updated_at: string;
}

// ── All ambulances ────────────────────────────────────────────
export function useAmbulances() {
    return useQuery<Ambulance[]>({
        queryKey: ['ambulances'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ambulances')
                .select('*')
                .order('status');
            if (error) throw error;
            return (data ?? []) as Ambulance[];
        },
        refetchInterval: 10000,
    });
}

// ── All ambulance requests ────────────────────────────────────
export function useAmbulanceRequests() {
    return useQuery<AmbulanceRequest[]>({
        queryKey: ['ambulance-requests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ambulance_requests')
                .select('*, ambulances(driver_name, vehicle_number, driver_phone)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as AmbulanceRequest[];
        },
        refetchInterval: 10000,
    });
}

// ── Realtime ambulance tracking ───────────────────────────────
export function useAmbulanceRealtime(onUpdate: () => void) {
    const queryClient = useQueryClient();
    useEffect(() => {
        const ch = supabase
            .channel('ambulance-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance_tracking' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ambulance-tracking'] });
                onUpdate();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance_requests' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ambulance-requests'] });
                onUpdate();
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [queryClient, onUpdate]);
}

// ── Create ambulance request (patient facing) ─────────────────
export function useCreateAmbulanceRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            patient_name: string;
            phone: string;
            latitude?: number;
            longitude?: number;
            address?: string;
            emergency_type: string;
        }) => {
            // Auto-assign nearest available ambulance
            const { data: available } = await supabase
                .from('ambulances')
                .select('id')
                .eq('status', 'available')
                .limit(1);

            const assignedId = available?.[0]?.id ?? null;

            const { data, error } = await supabase
                .from('ambulance_requests')
                .insert({
                    ...payload,
                    status: assignedId ? 'assigned' : 'pending',
                    assigned_ambulance_id: assignedId,
                })
                .select()
                .single();

            if (error) throw error;

            if (assignedId) {
                await supabase.from('ambulances').update({ status: 'busy' }).eq('id', assignedId);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ambulance-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            toast.success('🚑 Ambulance request submitted! Help is on the way.');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Update ambulance request status ──────────────────────────
export function useUpdateAmbulanceRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
            const { data: req } = await supabase
                .from('ambulance_requests').select('assigned_ambulance_id').eq('id', id).single();

            const { data, error } = await supabase
                .from('ambulance_requests').update({ status }).eq('id', id).select().single();
            if (error) throw error;

            // Free ambulance on completion
            if ((status === 'completed' || status === 'cancelled') && req?.assigned_ambulance_id) {
                await supabase.from('ambulances').update({ status: 'available' }).eq('id', req.assigned_ambulance_id);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ambulance-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            toast.success('Ambulance status updated');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Update ambulance status ───────────────────────────────────
export function useUpdateAmbulanceStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: AmbulanceStatus }) => {
            const { data, error } = await supabase
                .from('ambulances').update({ status }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            toast.success('Ambulance status updated');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}

// ── Create/Update ambulance (admin) ──────────────────────────
export function useUpsertAmbulance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Ambulance> & { driver_name: string; driver_phone: string; vehicle_number: string }) => {
            if (payload.id) {
                const { data, error } = await supabase.from('ambulances').update(payload).eq('id', payload.id).select().single();
                if (error) throw error;
                return data;
            }
            const { id: _id, ...rest } = payload;
            const { data, error } = await supabase.from('ambulances').insert(rest).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            toast.success(vars.id ? 'Ambulance updated' : 'Ambulance added');
        },
        onError: (e: Error) => toast.error(`Failed: ${e.message}`),
    });
}
