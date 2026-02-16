import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export type Appointment = Tables<"appointments"> & {
  patients: { name: string; patient_id: string } | null;
  doctors: { name: string; specialty: string } | null;
};

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration?: number;
  type: string;
  status?: string;
  notes?: string;
}

export const useAppointments = (date?: string) => {
  return useQuery({
    queryKey: ["appointments", date],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patients (name, patient_id),
          doctors (name, specialty)
        `)
        .order("appointment_time");

      if (date) {
        query = query.eq("appointment_date", date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: CreateAppointmentData) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert([appointment])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Success", description: "Appointment scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Success", description: "Appointment updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Success", description: "Appointment cancelled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
