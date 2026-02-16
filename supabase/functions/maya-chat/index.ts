import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "@supabase/supabase-js";

// Deno env typings
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== Types =====
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  sessionId: string;
}

// ===== Validation Constants =====
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES = 20;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9-_]{10,100}$/;

// ===== Validation =====
function validateRequest(
  body: unknown
): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const { messages, sessionId } = body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
    return { valid: false, error: "Invalid session ID format" };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Messages must be a non-empty array" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES} messages allowed` };
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: "Invalid message format" };
    }

    const { role, content } = msg as Record<string, unknown>;

    if (!["system", "user", "assistant"].includes(role as string)) {
      return { valid: false, error: "Invalid message role" };
    }

    if (typeof content !== "string" || content.length === 0) {
      return { valid: false, error: "Message content must be a non-empty string" };
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message content must be under ${MAX_MESSAGE_LENGTH} characters`,
      };
    }
  }

  return {
    valid: true,
    data: {
      messages: messages as Message[],
      sessionId: sessionId as string,
    },
  };
}

// ===== Sanitization =====
function sanitizeContent(content: string): string {
  return content
    .replace(/ignore\s*(all\s*)?(previous\s*)?instructions/gi, "")
    .replace(/you\s*are\s*now/gi, "")
    .replace(/pretend\s*(to\s*be|you\s*are)/gi, "")
    .trim();
}

// ===== Server =====
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedMessages = validation.data.messages.map((msg) => ({
      ...msg,
      content: msg.role === "user" ? sanitizeContent(msg.content) : msg.content,
    }));

    const systemMessage: Message = {
      role: "system",
      content: `You are Maya, an advanced AI health assistant for the MediCare Hospital Management System.

Rules:
- Be professional, warm, and clear
- NEVER diagnose medical conditions
- For emergencies, advise calling +1 (313) 540 9338
- Guide users to appropriate sections of the portal
`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...sanitizedMessages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("Invalid AI response");
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("maya-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
