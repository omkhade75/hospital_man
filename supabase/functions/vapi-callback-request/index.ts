

import { createClient } from "@supabase/supabase-js";

// Deno env typings
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

interface CallbackRequest {
    callbackId: string;
}

interface UserRole {
    role: string;
}

// Valid staff roles that can initiate calls
const STAFF_ROLES = ['admin', 'doctor', 'nurse', 'receptionist'];

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!VAPI_API_KEY) {
            console.error('VAPI_API_KEY not configured');
            throw new Error('Service configuration error');
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Supabase credentials not configured');
            throw new Error('Service configuration error');
        }

        // ============================================
        // SECURITY: Authorization Check
        // ============================================

        // Get the authorization header from the request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.warn('Unauthorized access attempt: No auth header');
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create a user-context client to verify the caller's identity
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Get the authenticated user
        const { data: { user }, error: userError } = await userClient.auth.getUser();

        let isStaff = false;
        let userId = 'public-anon';

        if (user) {
            userId = user.id;
            console.log(`Auth check passed for user: ${user.id}`);

            // Check if user has a staff role using the user's context
            const { data: userRoles, error: rolesError } = await userClient
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .returns<UserRole[]>();

            if (!rolesError && userRoles) {
                isStaff = userRoles.some((r: UserRole) => STAFF_ROLES.includes(r.role));
            }

            if (!isStaff) {
                // If logged in but not staff - technically patients shouldn't accept callbacks? 
                // Actually, if a patient triggers it for themselves, maybe okay?
                // But for now, let's strictly restrict "Staff" actions to Staff, 
                // and "Public" actions (no user) are allowed for the landing page.
                // Ideally we'd separate these, but for this task:
                console.log(`User ${user.id} is not staff.`);
            }
        } else {
            console.log('Public anonymous request received.');
        }

        // We allow if:
        // 1. User is Staff (Admin Panel usage)
        // 2. No User (Public Landing Page usage)
        if (user && !isStaff) {
            console.warn(`Access denied for authenticated non-staff user ${userId}`);
            return new Response(
                JSON.stringify({ error: 'Forbidden: Staff access required for authenticated users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Processing request for ${userId} (Staff: ${isStaff}, Public: ${!user})`);

        // ============================================
        // Input Validation
        // ============================================

        let requestBody: CallbackRequest & { name?: string, phone?: string, email?: string, reason?: string, preferred_time?: string };
        try {
            requestBody = await req.json();
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { callbackId } = requestBody;

        // Use service role for data access
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        let callbackData;

        // Scenario 1: callbackId provided (Existing record)
        if (callbackId) {
            const { data, error } = await supabase
                .from('callback_requests')
                .select('*')
                .eq('id', callbackId)
                .single();

            if (error || !data) {
                console.error('Callback not found:', error);
                return new Response(
                    JSON.stringify({ error: 'Callback request not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            callbackData = data;

            // Scenario 2: Direct submission (Insert new record)
        } else if (requestBody.name && requestBody.phone) {
            const { data, error } = await supabase
                .from('callback_requests')
                .insert({
                    name: requestBody.name,
                    phone: requestBody.phone,
                    email: requestBody.email,
                    reason: requestBody.reason,
                    preferred_time: requestBody.preferred_time,
                    // If user is authenticated, we could pass userId, but for now let's keep it simple or pass it in body
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to create callback request:', error);
                return new Response(
                    JSON.stringify({ error: 'Failed to create callback request' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            callbackData = data;
            console.log(`Created new callback request: ${callbackData.id}`);
        } else {
            return new Response(
                JSON.stringify({ error: 'Missing callbackId OR (name and phone)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { name, phone: phoneNumber, reason } = callbackData;

        if (!phoneNumber) {
            return new Response(
                JSON.stringify({ error: 'Missing phone number in callback request' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Processing callback for ${name} (${phoneNumber})`);

        // ============================================
        // Make Vapi Call
        // ============================================

        const prompt = `You are Maya, the AI receptionist for Star Hospital (Medicare).
You are calling a patient named ${name} who requested a callback.
Hospital Info: Star Hospital.
Reason for callback: ${reason || 'General Inquiry'}.

Task:
1. Introduce yourself warmly as Maya from Star Hospital.
2. Mention that you are calling because they requested a callback.
3. Ask how you can assist them today.
4. Listen to their query and answer relevant questions about appointments, reports, or general info.
5. If they need to speak to a human, apologize and say a staff member will call them shortly.


Languages:
IMPORTANT: You must detect the language the user is speaking (English, Hindi, or Marathi) and respond IN THAT SAME LANGUAGE.
- If the user speaks Hindi, reply in Hindi.
- If the user speaks Marathi, reply in Marathi.
- If the user speaks English, reply in English.
Do not just translate, but adopt the persona appropriate for that language. Start in English but switch IMMEDIATELY if they speak Hindi or Marathi.
`;

        console.log('Initiating Vapi call...');

        const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumberId: undefined, // Uses default
                customer: {
                    number: phoneNumber,
                    name: name,
                },
                assistant: {
                    firstMessage: `Namaste ${name}, this is Maya calling from Star Hospital. We received your request for a callback. How can I help you today?`,
                    model: {
                        provider: 'openai',
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: prompt
                            }
                        ]
                    },
                    voice: {
                        provider: 'playht',
                        voiceId: 'jennifer'
                    },
                },
            }),
        });

        if (!vapiResponse.ok) {
            const errorText = await vapiResponse.text();
            console.error('Vapi API error:', vapiResponse.status, errorText);
            throw new Error('Failed to initiate call via Vapi');
        }

        const vapiData = await vapiResponse.json();
        console.log('Vapi call initiated successfully:', { callId: vapiData.id });

        // Update status to processing or completed? leaving as is for now or maybe 'processing'
        // Let's just log it.

        return new Response(
            JSON.stringify({
                success: true,
                callId: vapiData.id,
                message: 'Callback initiated successfully',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in vapi-callback-request:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'An internal error occurred' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
