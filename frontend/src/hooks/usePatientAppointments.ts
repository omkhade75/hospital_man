import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

export type PatientAppointment = Tables<"patient_appointments"> & {
  doctors: { name: string; specialty: string } | null;
  departments: { name: string } | null;
};

export const usePatientAppointments = () => {
  return useQuery({
    queryKey: ["patient-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_appointments")
        .select(`
          *,
          doctors:doctor_id(name, specialty),
          departments:department_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PatientAppointment[];
    },
  });
};

export const useUpdatePatientAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; notes?: string }) => {
      const { error } = await supabase
        .from("patient_appointments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      toast.success("Appointment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error updating appointment: ${error.message}`);
    },
  });
};
