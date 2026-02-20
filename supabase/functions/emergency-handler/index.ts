// Supabase Edge Function: emergency-handler
// Handles: Vapi webhook -> create emergency_call -> auto-assign doctor -> trigger realtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Security-Policy": "default-src 'self'; frame-src 'self' https://*.supabase.co https://www.google.com https://google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; img-src 'self' https://i.ytimg.com https://img.youtube.com https://*.supabase.co data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;",
};

interface EmergencyPayload {
    caller_number?: string;
    patient_name?: string;
    emergency_type?: string;
    priority?: string;
    vapi_call_id?: string;
    notes?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        const body: EmergencyPayload = await req.json();

        const emergencyType = body.emergency_type ?? "general";
        const priority = body.priority ?? derivePriority(emergencyType);

        // ── Step 1: Create emergency record ──────────────────────
        const { data: emergency, error: insertError } = await supabase
            .from("emergency_calls")
            .insert({
                caller_number: body.caller_number ?? "Unknown",
                patient_name: body.patient_name ?? null,
                emergency_type: emergencyType,
                priority,
                status: "pending",
                vapi_call_id: body.vapi_call_id ?? null,
                notes: body.notes ?? null,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // ── Step 2: Find nearest available doctor in priority order
        const specialtyMap: Record<string, string[]> = {
            cardiac: ["Cardiology", "Emergency Medicine", "Internal Medicine"],
            stroke: ["Neurology", "Emergency Medicine"],
            trauma: ["Orthopedics", "Emergency Medicine", "General Surgery"],
            accident: ["Emergency Medicine", "Orthopedics", "General Surgery"],
            breathing: ["Pulmonology", "Emergency Medicine"],
            unconscious: ["Emergency Medicine", "Neurology"],
            general: ["Emergency Medicine", "Internal Medicine"],
            fire: ["Emergency Medicine"],
        };

        const preferredSpecialties = specialtyMap[emergencyType] ?? specialtyMap.general;

        let assignedDoctor = null;

        // Try preferred specializations first
        for (const spec of preferredSpecialties) {
            const { data: docs } = await supabase
                .from("doctors")
                .select("id, name, specialization, phone")
                .eq("status", "active")
                .eq("is_available", true)
                .ilike("specialization", `%${spec}%`)
                .limit(1);

            if (docs && docs.length > 0) {
                assignedDoctor = docs[0];
                break;
            }
        }

        // Fallback: any available active doctor
        if (!assignedDoctor) {
            const { data: anyDoc } = await supabase
                .from("doctors")
                .select("id, name, specialization, phone")
                .eq("status", "active")
                .eq("is_available", true)
                .limit(1);

            assignedDoctor = anyDoc?.[0] ?? null;
        }

        // ── Step 3: Assign doctor & update records atomically ─────
        if (assignedDoctor) {
            // Update emergency with doctor assignment
            await supabase
                .from("emergency_calls")
                .update({
                    assigned_doctor_id: assignedDoctor.id,
                    status: "assigned",
                })
                .eq("id", emergency.id);

            // Mark doctor as unavailable
            await supabase
                .from("doctors")
                .update({ is_available: false })
                .eq("id", assignedDoctor.id);
        }

        // ── Step 4: If Vapi call, store transcript placeholder ────
        if (body.vapi_call_id) {
            await supabase.from("call_transcripts").insert({
                emergency_call_id: emergency.id,
                vapi_call_id: body.vapi_call_id,
                detected_type: emergencyType,
                priority_suggested: priority,
                transcript: null,
                summary: `Emergency call received. Type: ${emergencyType}. Priority: ${priority}.`,
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                emergency_id: emergency.id,
                assigned_doctor: assignedDoctor
                    ? { id: assignedDoctor.id, name: assignedDoctor.name, specialization: assignedDoctor.specialization }
                    : null,
                priority,
                message: assignedDoctor
                    ? `Dr. ${assignedDoctor.name} (${assignedDoctor.specialization}) has been assigned.`
                    : "Emergency logged. No doctor immediately available — manual assignment required.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (err) {
        console.error("Emergency handler error:", err);
        return new Response(
            JSON.stringify({ success: false, error: String(err) }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

function derivePriority(type: string): string {
    const critical = ["cardiac", "stroke", "unconscious", "breathing"];
    const high = ["trauma", "accident", "fire"];
    if (critical.includes(type)) return "critical";
    if (high.includes(type)) return "high";
    return "medium";
}
