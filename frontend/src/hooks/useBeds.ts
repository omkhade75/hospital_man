import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export type Bed = Tables<"beds"> & {
    departments: { name: string } | null;
    patients: { name: string } | null;
};

export type CreateBedData = {
    bed_number: string;
    room_number: string;
    department_id: string;
    bed_type?: string;
    status?: string;
};

export const useBeds = () => {
    return useQuery({
        queryKey: ["beds"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("beds")
                .select(`
          *,
          departments (
            name
          ),
          patients (
            name
          )
        `)
                .order("room_number", { ascending: true })
                .order("bed_number", { ascending: true });

            if (error) throw error;
            return data as Bed[];
        },
    });
};

export const useCreateBed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bed: CreateBedData) => {
            const { data, error } = await supabase
                .from("beds")
                .insert([bed])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beds"] });
            toast({ title: "Success", description: "Bed added successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
};

export const useDeleteBed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("beds")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beds"] });
            toast({ title: "Success", description: "Bed deleted successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
};

export const useUpdateBedStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, patient_id }: { id: string; status: string; patient_id?: string | null }) => {
            const { data, error } = await supabase
                .from("beds")
                .update({ status, patient_id })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beds"] });
            toast({ title: "Success", description: "Bed status updated successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
};
