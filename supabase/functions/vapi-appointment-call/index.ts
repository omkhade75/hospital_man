
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

interface UserRole {
  role: string;
}

interface AppointmentCallRequest {
  appointmentId: string;
  action: 'confirm' | 'reminder' | 'cancel';
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
    const VAPI_PHONE_NUMBER_ID = Deno.env.get('VAPI_PHONE_NUMBER_ID');

    if (!VAPI_API_KEY) {
      console.error('VAPI_API_KEY not configured');
      throw new Error('Service configuration error: Missing VAPI_API_KEY');
    }

    if (!VAPI_PHONE_NUMBER_ID) {
      console.error('VAPI_PHONE_NUMBER_ID not configured');
      throw new Error('Service configuration error: Missing VAPI_PHONE_NUMBER_ID');
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured');
      throw new Error('Service configuration error: Missing Supabase credentials');
    }

    // ============================================
    // SECURITY: Authorization Check
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auth check passed for user: ${user.id}`);

    const { data: userRoles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .returns<UserRole[]>();

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Authorization check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasStaffRole = userRoles?.some((r: UserRole) => STAFF_ROLES.includes(r.role));
    if (!hasStaffRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Staff access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = userRoles?.map((r: UserRole) => r.role).join(', ');
    console.log(`Staff authorization confirmed. User ${user.id} has roles: ${userRole}`);

    // ============================================
    // Input Validation
    // ============================================
    let requestBody: AppointmentCallRequest;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { appointmentId, action } = requestBody;

    if (!appointmentId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: appointmentId and action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid appointmentId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['confirm', 'reminder', 'cancel'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be confirm, reminder, or cancel.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} call for appointment: ${appointmentId}`);

    // ============================================
    // Fetch Appointment Data
    // ============================================
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let appointment: Record<string, unknown> | null = null;
    let appointmentType = 'patient';

    const { data: patientAppointment } = await supabase
      .from('patient_appointments')
      .select(`*, doctor:doctors(name, specialty), department:departments(name)`)
      .eq('id', appointmentId)
      .single();

    if (!patientAppointment) {
      const { data: regularAppointment } = await supabase
        .from('appointments')
        .select(`*, patient:patients(name, phone), doctor:doctors(name, specialty)`)
        .eq('id', appointmentId)
        .single();

      if (!regularAppointment) {
        console.warn(`Appointment not found: ${appointmentId}`);
        return new Response(
          JSON.stringify({ error: 'Appointment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      appointment = regularAppointment;
      appointmentType = 'regular';
    } else {
      appointment = patientAppointment;
    }

    console.log('Appointment found:', { appointmentType, id: appointment!.id });

    // Extract patient info (appointment is guaranteed non-null here)
    const appt = appointment!;
    const phoneNumber = (appointmentType === 'patient'
      ? appt.patient_phone
      : (appt.patient as Record<string, unknown>)?.phone) as string | undefined;

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'No phone number found for this appointment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize Indian phone number
    let normalizedPhone = String(phoneNumber).trim().replace(/[\s\-()]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+91' + normalizedPhone.slice(1);
      } else if (normalizedPhone.length === 10) {
        normalizedPhone = '+91' + normalizedPhone;
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone;
      }
    }

    const patientName = (appointmentType === 'patient'
      ? appt.patient_name
      : (appt.patient as Record<string, unknown>)?.name || 'Patient') as string;

    const doctor = appt.doctor as Record<string, unknown> | undefined;
    const doctorName = doctor?.name as string || 'your doctor';
    const specialty = doctor?.specialty as string || '';
    const department = appt.department as Record<string, unknown> | undefined;
    const departmentName = department?.name as string || '';

    const appointmentDate = (appointmentType === 'patient'
      ? appt.preferred_date
      : appt.appointment_date) as string || 'your scheduled date';
    const appointmentTime = (appointmentType === 'patient'
      ? appt.preferred_time
      : appt.appointment_time) as string || '';

    // ============================================
    // Build Call Message (First Spoken Sentence)
    // ============================================
    let firstMessage = '';
    let systemPrompt = '';

    switch (action) {
      case 'confirm':
        firstMessage = `Namaste! Main Star Hospital se Maya bol rahi hoon. Kya aap ${patientName} ji bol rahe hain? Main aapka appointment confirm karne ke liye call kar rahi hoon jo ${doctorName} ke saath ${appointmentDate}${appointmentTime ? ' ko ' + appointmentTime + ' baje' : ''} scheduled hai. Kya aap confirm karna chahenge?`;
        systemPrompt = `You are Maya, a warm and professional AI receptionist for Star Hospital, calling to confirm an appointment.

KEY DETAILS:
- Patient Name: ${patientName}
- Doctor: ${doctorName}${specialty ? ' (' + specialty + ')' : ''}${departmentName ? ', ' + departmentName + ' department' : ''}
- Date: ${appointmentDate}${appointmentTime ? ' at ' + appointmentTime : ''}
- Appointment ID: ${appointmentId}

YOUR GOAL: Confirm the appointment verbally with the patient.

LANGUAGE RULES:
- Start in Hindi/Hinglish (natural mix of Hindi and English like Indians speak).
- If they respond in pure English, switch to English.
- If they speak Hindi, stay in Hindi.
- Use natural Indian speech patterns like "ji", "haan", "theek hai", "bilkul".

BEHAVIOR:
- If patient says YES/confirm/haan/theek hai → call the confirmAppointment tool with appointmentId: "${appointmentId}"
- If patient wants to reschedule → say "Koi baat nahi, hamare staff member aapse jald hi contact karenge."
- Keep responses SHORT and NATURAL (1-2 sentences max).
- Be warm, helpful, and sound human.
- Do NOT say you are an AI.`;
        break;

      case 'reminder':
        firstMessage = `Namaste ${patientName} ji! Main Star Hospital se Maya bol rahi hoon. Aapko yaad dilana chahti thi ki aapka appointment ${doctorName} ke saath ${appointmentDate}${appointmentTime ? ' ko ' + appointmentTime + ' baje' : ''} scheduled hai. Kripaya 15 minute pehle aa jayein. Shukriya!`;
        systemPrompt = `You are Maya, a warm AI receptionist at Star Hospital, calling to remind a patient about their appointment.

Patient: ${patientName}, Appointment with ${doctorName} on ${appointmentDate}${appointmentTime ? ' at ' + appointmentTime : ''}.

LANGUAGE: Speak naturally in Hindi/Hinglish. Switch to English if they respond in English.
Be brief, warm, and helpful. Do NOT say you are an AI.`;
        break;

      case 'cancel':
        firstMessage = `Namaste ${patientName} ji! Main Star Hospital se Maya bol rahi hoon. Aapko inform karna chahti thi ki ${doctorName} ke saath aapka ${appointmentDate} ka appointment unfortunately cancel ho gaya hai. Inconvenience ke liye maafi chahti hoon. Kripaya humse contact karein nayi appointment ke liye.`;
        systemPrompt = `You are Maya, a warm AI receptionist at Star Hospital, informing a patient about a cancelled appointment.

Patient: ${patientName}, Doctor: ${doctorName}, Date: ${appointmentDate}.

Be empathetic and apologetic. Offer to help reschedule. Speak in Hindi/Hinglish.
Do NOT say you are an AI.`;
        break;
    }

    // ============================================
    // Audit Log
    // ============================================
    console.log('AUDIT: Initiating Vapi call', {
      staffUserId: user.id,
      staffRole: userRole,
      appointmentId,
      action,
      patientName,
      normalizedPhone,
      timestamp: new Date().toISOString()
    });

    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/vapi-webhook`;

    // ============================================
    // Make Vapi Call - FULLY INLINE ASSISTANT
    // (No assistantId, no assistantOverrides to avoid silent call bugs)
    // ============================================
    const vapiPayload = {
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: normalizedPhone,
        name: patientName,
      },
      assistant: {
        name: "Maya-Hospital",
        firstMessage: firstMessage,
        firstMessageMode: "assistant-speaks-first",
        serverUrl: WEBHOOK_URL,
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
          ],
          tools: action === 'confirm' ? [
            {
              type: "function",
              function: {
                name: "confirmAppointment",
                description: "Call this when the patient verbally agrees to confirm their appointment.",
                parameters: {
                  type: "object",
                  properties: {
                    appointmentId: {
                      type: "string",
                      description: "The appointment ID to confirm"
                    }
                  },
                  required: ["appointmentId"]
                }
              }
            }
          ] : [],
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
        endCallMessage: "Dhanyawad! Star Hospital ki taraf se aapka din shubh ho. Namaste!",
        endCallPhrases: [
          "goodbye", "bye", "alvida", "theek hai shukriya", "dhanyawad",
          "ok thanks", "okay bye", "kal milte hain"
        ],
        voicemailDetection: {
          enabled: false
        },
        backgroundDenoisingEnabled: true,
        analysisPlan: {
          summaryPrompt: "Summarize what happened in this hospital appointment call in 1-2 sentences.",
        },
        maxDurationSeconds: 600,
      },
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
      console.error('Vapi API error:', vapiResponse.status, responseText);
      throw new Error(`Vapi call failed: ${responseText}`);
    }

    const vapiData = JSON.parse(responseText);
    console.log('Vapi call initiated successfully:', { callId: vapiData.id });

    // Update appointment status if confirming
    if (action === 'confirm') {
      const table = appointmentType === 'patient' ? 'patient_appointments' : 'appointments';
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'call_initiated' })
        .eq('id', appointmentId);

      if (updateError) {
        console.warn('Failed to update appointment status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        callId: vapiData.id,
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} call initiated successfully to ${normalizedPhone}`,
        debug: {
          firstMessage: firstMessage.slice(0, 100) + '...',
          normalizedPhone,
          vapiCallId: vapiData.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in vapi-appointment-call:', errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
