

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
    if (userError || !user) {
      console.warn('Unauthorized access attempt: Invalid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auth check passed for user: ${user.id}`);

    // Check if user has a staff role using the user's context
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

    // Verify user has at least one staff role
    const hasStaffRole = userRoles?.some((r: UserRole) => STAFF_ROLES.includes(r.role));
    if (!hasStaffRole) {
      console.warn(`Access denied for user ${user.id}: No staff role found`);
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

    // Validate required fields
    if (!appointmentId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate appointmentId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action is one of allowed values
    if (!['confirm', 'reminder', 'cancel'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} call for appointment: ${appointmentId} by staff user ${user.id}`);

    // ============================================
    // Fetch Appointment (using service role after auth)
    // ============================================

    // Now that we've verified the user is staff, use service role for data access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch appointment details - try patient_appointments first
    let appointment;
    let appointmentType = 'patient';

    const { data: patientAppointment } = await supabase
      .from('patient_appointments')
      .select(`
        *,
        doctor:doctors(name, specialty),
        department:departments(name)
      `)
      .eq('id', appointmentId)
      .single();

    if (!patientAppointment) {
      // Try regular appointments table
      const { data: regularAppointment } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(name, phone),
          doctor:doctors(name, specialty)
        `)
        .eq('id', appointmentId)
        .single();

      if (!regularAppointment) {
        // Return generic error to prevent enumeration
        console.warn(`Appointment not found: ${appointmentId}`);
        return new Response(
          JSON.stringify({ error: 'Unable to process request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      appointment = regularAppointment;
      appointmentType = 'regular';
    } else {
      appointment = patientAppointment;
    }

    console.log('Appointment found:', { appointmentType, id: appointment.id });

    // Get phone number based on appointment type
    const phoneNumber = appointmentType === 'patient'
      ? appointment.patient_phone
      : appointment.patient?.phone;

    if (!phoneNumber) {
      console.error('No phone number available for appointment');
      return new Response(
        JSON.stringify({ error: 'Unable to process request: Missing contact information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient and doctor names
    const patientName = appointmentType === 'patient'
      ? appointment.patient_name
      : appointment.patient?.name || 'Patient';

    const doctorName = appointment.doctor?.name || 'your doctor';
    const specialty = appointment.doctor?.specialty || '';
    const departmentName = appointment.department?.name || '';

    // Get appointment date/time
    const appointmentDate = appointmentType === 'patient'
      ? appointment.preferred_date
      : appointment.appointment_date;
    const appointmentTime = appointmentType === 'patient'
      ? appointment.preferred_time
      : appointment.appointment_time;

    // Build the call message based on action
    let callMessage = '';
    switch (action) {
      case 'confirm':
        callMessage = `Hello ${patientName}, this is Star Hospital calling to confirm your appointment with ${doctorName}${specialty ? `, ${specialty}` : ''}${departmentName ? ` in the ${departmentName} department` : ''}, scheduled for ${appointmentDate}${appointmentTime ? ` at ${appointmentTime}` : ''}. Please press 1 to confirm your appointment, or press 2 if you need to reschedule. Thank you for choosing Star Hospital.`;
        break;
      case 'reminder':
        callMessage = `Hello ${patientName}, this is a friendly reminder from Star Hospital about your upcoming appointment with ${doctorName}${specialty ? `, ${specialty}` : ''}, scheduled for ${appointmentDate}${appointmentTime ? ` at ${appointmentTime}` : ''}. Please arrive 15 minutes early. If you have any questions, please contact us. Thank you!`;
        break;
      case 'cancel':
        callMessage = `Hello ${patientName}, this is Star Hospital. We regret to inform you that your appointment with ${doctorName} scheduled for ${appointmentDate} has been cancelled. Please contact us to reschedule at your earliest convenience. We apologize for any inconvenience. Thank you.`;
        break;
    }

    // ============================================
    // Audit Log
    // ============================================
    console.log('AUDIT: Call initiated', {
      staffUserId: user.id,
      staffRole: userRole,
      appointmentId: appointment.id,
      action,
      patientName,
      timestamp: new Date().toISOString()
    });

    console.log('Initiating Vapi call to:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));

    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/vapi-webhook`;

    // Make the Vapi API call
    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId: undefined, // Will use Vapi's default number
        customer: {
          number: phoneNumber,
          name: patientName,
        },
        assistant: {
          firstMessage: callMessage,
          serverUrl: WEBHOOK_URL,
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            tools: [
              {
                type: "function",
                function: {
                  name: "confirmAppointment",
                  description: "Confirms the appointment when the user says yes/confirms.",
                  parameters: {
                    type: "object",
                    properties: {
                      appointmentId: {
                        type: "string",
                        description: "The ID of the appointment to confirm."
                      }
                    },
                    required: ["appointmentId"]
                  }
                }
              }
            ],
            messages: [
              {
                role: 'system',
                content: `You are a professional hospital receptionist for Star Hospital named Maya. You are making a ${action} call for an appointment. 
                
                CONTEXT: Appointment ID: ${appointmentId}.
                
                IMPORTANT: 
                1. If the patient confirms (says yes, okay, confirm, etc.), you MUST explicitly call the 'confirmAppointment' tool with the Appointment ID provided above.
                2. You must detect the language the user is speaking (English, Hindi, or Marathi) and respond IN THAT SAME LANGUAGE.
                - If the user speaks Hindi, reply in Hindi.
                - If the user speaks Marathi, reply in Marathi.
                - If the user speaks English, reply in English.
                
                Be polite, clear, and helpful. If they want to reschedule, let them know a staff member will contact them. Keep responses brief and professional.`
              }
            ]
          },
          voice: {
            provider: 'playht',
            voiceId: 'jennifer'
          },
          endCallMessage: 'Thank you for choosing Star Hospital. Have a great day!',
          endCallPhrases: ['goodbye', 'bye', 'thank you', 'thanks'],
        },
        maxDuration: 120, // 2 minutes max
      }),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error('Vapi API error:', vapiResponse.status, errorText);
      throw new Error('Failed to initiate call');
    }

    const vapiData = await vapiResponse.json();
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
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} call initiated successfully`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in vapi-appointment-call:', error);
    // Return generic error to prevent information disclosure
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
