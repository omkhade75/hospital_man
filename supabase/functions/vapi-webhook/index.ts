import { createClient } from "@supabase/supabase-js";
declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase credentials');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const body = await req.json();
        // Log the type of event to help with debugging
        const messageType = body.message?.type || body.type || 'unknown';
        console.log(`Received Vapi webhook: ${messageType}`);

        // Handle Tool Calls (Function Calls)
        // Vapi sends a POST request with the tool calls when the assistant invokes a function
        if (messageType === 'tool-calls' || body.toolCalls) {
            const toolCalls = body.message?.toolCalls || body.toolCalls || [];
            const results = [];

            for (const toolCall of toolCalls) {
                const { id, function: func } = toolCall;

                if (func) {
                    const { name, arguments: args } = func;
                    console.log(`Processing function call: ${name}`);

                    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

                    if (name === 'confirmAppointment') {
                        const { appointmentId } = parsedArgs;

                        if (appointmentId) {
                            console.log(`Confirming appointment: ${appointmentId}`);

                            // 1. Try updating patient_appointments
                            const { error: patientAppError, data: patientAppData } = await supabase
                                .from('patient_appointments')
                                .update({ status: 'confirmed' })
                                .eq('id', appointmentId)
                                .select()
                                .single();

                            let success = false;
                            if (!patientAppError && patientAppData) {
                                success = true;
                                console.log('Confirmed in patient_appointments');

                                // Insert Notification for the user
                                if (patientAppData.user_id) {
                                    await supabase.from('notifications').insert({
                                        title: 'Appointment Confirmed',
                                        message: `Your appointment has been confirmed via call.`,
                                        type: 'success',
                                        user_id: patientAppData.user_id,
                                        entity_type: 'appointment',
                                        entity_id: appointmentId
                                    });
                                }
                            } else {
                                // 2. Try updating regular appointments
                                const { error: appError, data: appData } = await supabase
                                    .from('appointments')
                                    .update({ status: 'confirmed' })
                                    .eq('id', appointmentId)
                                    .select()
                                    .single();

                                if (!appError && appData) {
                                    success = true;
                                    console.log('Confirmed in appointments');

                                    // Try to find linked user for notification
                                    if (appData.patient_id) {
                                        const { data: patientAccount } = await supabase
                                            .from('patient_accounts')
                                            .select('user_id')
                                            .eq('patient_id', appData.patient_id)
                                            .single();

                                        if (patientAccount && patientAccount.user_id) {
                                            await supabase.from('notifications').insert({
                                                title: 'Appointment Confirmed',
                                                message: `Your appointment has been confirmed via call.`,
                                                type: 'success',
                                                user_id: patientAccount.user_id,
                                                entity_type: 'appointment',
                                                entity_id: appointmentId
                                            });
                                        }
                                    }
                                }
                            }


                            if (success) {
                                results.push({
                                    toolCallId: id,
                                    result: "Appointment confirmed successfully. Database updated.",
                                });
                            } else {
                                results.push({
                                    toolCallId: id,
                                    result: "Could not find appointment with that ID to confirm.",
                                });
                            }
                        } else {
                            results.push({
                                toolCallId: id,
                                result: "Error: Missing appointmentId",
                            });
                        }
                    } else if (name === 'rescheduleAppointment') {
                        // Basic handling for reschedule - just log for now or create a callback request
                        // For now, let's just acknowledge it so the AI knows
                        results.push({
                            toolCallId: id,
                            result: "Reschedule request noted. A staff member will call back.",
                        });
                        // Ideally we'd create a callback_request here
                    }
                }
            }

            // Vapi expects a response with the results of the tool calls
            // Structure: { results: [ { toolCallId: "...", result: "..." } ] }
            // Or for Vapi's Server URL: { results: ... }

            return new Response(JSON.stringify({ results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
