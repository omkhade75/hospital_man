
import { createClient } from "@supabase/supabase-js";

// Deno typings
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
        const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY') || Deno.env.get('VAPI_PRIVATE_KEY');
        const VAPI_PHONE_NUMBER_ID = Deno.env.get('VAPI_PHONE_NUMBER_ID') || Deno.env.get('VITE_VAPI_PHONE_NUMBER_ID');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!VAPI_API_KEY) throw new Error('Missing VAPI_API_KEY (or VAPI_PRIVATE_KEY)');
        if (!VAPI_PHONE_NUMBER_ID) throw new Error('Missing VAPI_PHONE_NUMBER_ID');
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase credentials');
        }

        // ============================================
        // Auth + Role Check (allow staff AND public)
        // ============================================
        const authHeader = req.headers.get('Authorization');

        let isAuthenticated = false;
        let userId = 'anonymous';

        if (authHeader) {
            const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: authHeader } }
            });
            const { data: { user } } = await userClient.auth.getUser();
            if (user) {
                isAuthenticated = true;
                userId = user.id;
                console.log(`Authenticated request from user: ${userId}`);
            }
        } else {
            console.log('Public/anonymous callback request');
        }

        // ============================================
        // Parse Request Body
        // ============================================
        let requestBody: {
            callbackId?: string;
            name?: string;
            phone?: string;
            email?: string;
            reason?: string;
            preferred_time?: string;
        };

        try {
            requestBody = await req.json();
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON in request body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Request body:', JSON.stringify(requestBody));

        // ============================================
        // Get or Create Callback Record
        // ============================================
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        let callbackData: Record<string, unknown> | null = null;

        if (requestBody.callbackId) {
            // Look up existing callback
            const { data, error } = await supabase
                .from('callback_requests')
                .select('*')
                .eq('id', requestBody.callbackId)
                .single();

            if (error || !data) {
                return new Response(
                    JSON.stringify({ error: 'Callback request not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            callbackData = data;
            console.log(`Found existing callback: ${callbackData!.id}`);

        } else if (requestBody.name && requestBody.phone) {
            // Create new callback record
            const { data, error } = await supabase
                .from('callback_requests')
                .insert({
                    name: requestBody.name,
                    phone: requestBody.phone,
                    email: requestBody.email || null,
                    reason: requestBody.reason || 'General Inquiry',
                    preferred_time: requestBody.preferred_time || null,
                })
                .select()
                .single();

            if (error || !data) {
                console.error('Failed to create callback:', error);
                return new Response(
                    JSON.stringify({ error: 'Failed to create callback request' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            callbackData = data;
            console.log(`Created new callback request: ${callbackData!.id}`);

        } else {
            return new Response(
                JSON.stringify({ error: 'Provide either callbackId OR both name and phone' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const cb = callbackData!;
        const name = String(cb.name || 'Patient');
        const phoneNumber = String(cb.phone || '');
        const reason = String(cb.reason || 'General Inquiry');

        if (!phoneNumber) {
            return new Response(
                JSON.stringify({ error: 'No phone number in callback record' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Normalize phone number for India
        let normalizedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
        if (!normalizedPhone.startsWith('+')) {
            if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '+91' + normalizedPhone.slice(1);
            } else if (normalizedPhone.length === 10) {
                normalizedPhone = '+91' + normalizedPhone;
            } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
                normalizedPhone = '+' + normalizedPhone;
            }
        }

        console.log(`Initiating callback call to ${name} at ${normalizedPhone}`);

        // ============================================
        // Vapi Call - FULLY INLINE ASSISTANT
        // ============================================
        const firstMessage = `Namaste! Main Star Hospital se Maya bol rahi hoon. Kya aap ${name} ji se baat ho sakti hai? Aapne humse callback request ki thi. Main aapki kaise madad kar sakti hoon?`;

        const systemPrompt = `You are Maya, a warm and professional AI receptionist at Star Hospital.

You are calling ${name} because they requested a callback.
Reason for their callback: ${reason}

YOUR TASK:
1. Warmly greet them and confirm you're speaking with the right person.
2. Ask how you can help them.
3. Answer questions about appointments, doctors, timings, reports, or general hospital info.
4. If they need a human staff member, say "Hum aapko jaldi callback karenge" and end politely.

LANGUAGE:
- Speak naturally in Hindi/Hinglish (mix of Hindi and English like Indians speak daily).
- If they speak English, switch to clear Indian-accented English.
- Use natural phrases: "haan ji", "bilkul", "zaroor", "koi baat nahi", "shukriya".

HOSPITAL INFO:
- Name: Star Hospital (also called Medicare)
- Emergency: 102
- Services: Cardiology, Orthopedics, General Medicine, Gynecology, Pediatrics, and more.

Keep responses SHORT (1-2 sentences). Do NOT say you are an AI.`;

        const vapiPayload = {
            phoneNumberId: VAPI_PHONE_NUMBER_ID,
            customer: {
                number: normalizedPhone,
                name: name,
            },
            assistant: {
                name: "Maya-Callback",
                firstMessage: firstMessage,
                firstMessageMode: "assistant-speaks-first",
                model: {
                    provider: "openai",
                    model: "gpt-4o-mini",
                    temperature: 0.7,
                    maxTokens: 150,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        }
                    ]
                },
                voice: {
                    provider: "playht",
                    voiceId: "hindi-female",
                },
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "hi",
                    smartFormat: true,
                },
                endCallMessage: "Dhanyawad! Star Hospital mein aapka swagat hai. Namaste!",
                endCallPhrases: [
                    "goodbye", "bye", "alvida", "shukriya", "dhanyawad",
                    "theek hai bye", "ok thanks bye", "namaste"
                ],
                voicemailDetection: {
                    enabled: false
                },
                backgroundDenoisingEnabled: true,
                maxDurationSeconds: 600,
            }
        };

        console.log('Sending Vapi payload:', JSON.stringify(vapiPayload, null, 2));

        const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vapiPayload),
        });

        const responseText = await vapiResponse.text();
        console.log(`Vapi response status: ${vapiResponse.status}`);
        console.log(`Vapi response body: ${responseText}`);

        if (!vapiResponse.ok) {
            throw new Error(`Vapi API error ${vapiResponse.status}: ${responseText}`);
        }

        const vapiData = JSON.parse(responseText);
        console.log('Vapi call initiated:', { callId: vapiData.id });

        // Update callback status
        await supabase
            .from('callback_requests')
            .update({ status: 'processing' })
            .eq('id', cb.id);

        return new Response(
            JSON.stringify({
                success: true,
                callId: vapiData.id,
                message: 'Callback call initiated successfully',
                debug: {
                    to: normalizedPhone,
                    firstMessage: firstMessage.slice(0, 80) + '...'
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in vapi-callback-request:', errMsg);
        return new Response(
            JSON.stringify({ error: errMsg }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
