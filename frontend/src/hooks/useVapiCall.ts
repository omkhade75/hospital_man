import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type CallAction = 'confirm' | 'reminder' | 'cancel';

interface VapiCallParams {
  appointmentId: string;
  action: CallAction;
}

interface VapiCallResponse {
  success: boolean;
  callId: string;
  message: string;
  phoneNumber: string;
}

export const useVapiCall = () => {
  return useMutation({
    mutationFn: async ({ appointmentId, action }: VapiCallParams): Promise<VapiCallResponse> => {
      const { data, error } = await supabase.functions.invoke('vapi-appointment-call', {
        body: { appointmentId, action },
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate call');
      }

      if (!data.success) {
        throw new Error(data.error || 'Call failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Call Initiated",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Call Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
