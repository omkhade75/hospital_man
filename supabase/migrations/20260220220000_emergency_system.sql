-- ============================================================
-- EMERGENCY & SMART HOSPITAL MANAGEMENT SYSTEM
-- Migration: 20260220220000_emergency_system.sql
-- ============================================================

-- ── 1. EMERGENCY DOCTORS TABLE (separate from main doctors) ──
CREATE TABLE IF NOT EXISTS public.emergency_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'inactive')
    ),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_doctors_status ON public.emergency_doctors (status);

CREATE INDEX IF NOT EXISTS idx_emergency_doctors_is_available ON public.emergency_doctors (is_available);

CREATE INDEX IF NOT EXISTS idx_emergency_doctors_specialization ON public.emergency_doctors (specialization);

ALTER TABLE public.emergency_doctors ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "emergency_doctors_admin_all" ON public.emergency_doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role = 'admin'
    )
  );

-- Authenticated staff can read active emergency doctors
CREATE POLICY "emergency_doctors_staff_select" ON public.emergency_doctors FOR
SELECT USING (
        auth.uid () IS NOT NULL
        AND status = 'active'
    );

-- ── 2. EMERGENCY CALLS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    caller_number TEXT,
    patient_name TEXT,
    emergency_type TEXT NOT NULL DEFAULT 'general' CHECK (
        emergency_type IN (
            'cardiac',
            'trauma',
            'stroke',
            'accident',
            'fire',
            'breathing',
            'unconscious',
            'general'
        )
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'assigned',
            'in_progress',
            'completed',
            'cancelled'
        )
    ),
    priority TEXT NOT NULL DEFAULT 'high' CHECK (
        priority IN (
            'critical',
            'high',
            'medium',
            'low'
        )
    ),
    assigned_doctor_id UUID REFERENCES public.emergency_doctors (id) ON DELETE SET NULL,
    notes TEXT,
    vapi_call_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_calls_status ON public.emergency_calls (status);

CREATE INDEX IF NOT EXISTS idx_emergency_calls_created_at ON public.emergency_calls (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_calls_priority ON public.emergency_calls (priority);

ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;

-- Admin & staff can read all emergencies
CREATE POLICY "emergency_calls_staff_select" ON public.emergency_calls FOR
SELECT USING (auth.uid () IS NOT NULL);

-- Admin can insert / update / delete
CREATE POLICY "emergency_calls_admin_write" ON public.emergency_calls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role IN ('admin','doctor','nurse','receptionist')
    )
  );

-- Allow anon inserts (webhook from Vapi edge function uses service key, but keep open for now)
CREATE POLICY "emergency_calls_anon_insert" ON public.emergency_calls FOR
INSERT
WITH
    CHECK (TRUE);

-- ── 3. AMBULANCES TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    vehicle_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'available' CHECK (
        status IN (
            'available',
            'busy',
            'offline'
        )
    ),
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambulances_status ON public.ambulances (status);

ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambulances_admin_all" ON public.ambulances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role = 'admin'
    )
  );

CREATE POLICY "ambulances_staff_select" ON public.ambulances FOR
SELECT USING (auth.uid () IS NOT NULL);

-- Allow anon updates for staff (ambulance status changes)
CREATE POLICY "ambulances_staff_update" ON public.ambulances FOR
UPDATE USING (auth.uid () IS NOT NULL);

-- ── 4. AMBULANCE REQUESTS TABLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambulance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    address TEXT,
    emergency_type TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'assigned',
            'on_the_way',
            'arrived',
            'completed',
            'cancelled'
        )
    ),
    assigned_ambulance_id UUID REFERENCES public.ambulances (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambulance_requests_status ON public.ambulance_requests (status);

CREATE INDEX IF NOT EXISTS idx_ambulance_requests_created_at ON public.ambulance_requests (created_at DESC);

ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can request an ambulance
CREATE POLICY "ambulance_requests_anon_insert" ON public.ambulance_requests FOR
INSERT
WITH
    CHECK (TRUE);

CREATE POLICY "ambulance_requests_staff_select" ON public.ambulance_requests FOR
SELECT USING (auth.uid () IS NOT NULL);

CREATE POLICY "ambulance_requests_admin_update" ON public.ambulance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role IN ('admin','nurse','receptionist')
    )
  );

-- Allow authenticated users to update (for status lifecycle)
CREATE POLICY "ambulance_requests_auth_update" ON public.ambulance_requests FOR
UPDATE USING (auth.uid () IS NOT NULL);

-- ── 5. AMBULANCE TRACKING TABLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambulance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    ambulance_id UUID NOT NULL REFERENCES public.ambulances (id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_tracking_ambulance_id ON public.ambulance_tracking (ambulance_id);

CREATE INDEX IF NOT EXISTS idx_amb_tracking_updated_at ON public.ambulance_tracking (updated_at DESC);

ALTER TABLE public.ambulance_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambulance_tracking_staff_select" ON public.ambulance_tracking FOR
SELECT USING (auth.uid () IS NOT NULL);

CREATE POLICY "ambulance_tracking_admin_write" ON public.ambulance_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role IN ('admin','nurse')
    )
  );

-- ── 6. FIRST AID GUIDES TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.first_aid_guides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  steps           TEXT[] NOT NULL DEFAULT '{}',
  severity_level  TEXT NOT NULL DEFAULT 'high'
                    CHECK (severity_level IN ('critical','high','medium','low')),
  icon            TEXT DEFAULT 'heart-pulse',
  color           TEXT DEFAULT 'red',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.first_aid_guides ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read guides
CREATE POLICY "first_aid_guides_select" ON public.first_aid_guides FOR
SELECT USING (TRUE);

-- Only admin can write
CREATE POLICY "first_aid_guides_admin_write" ON public.first_aid_guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role = 'admin'
    )
  );

-- ── 7. CALL TRANSCRIPTS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    emergency_call_id UUID REFERENCES public.emergency_calls (id) ON DELETE CASCADE,
    vapi_call_id TEXT,
    transcript TEXT,
    summary TEXT,
    detected_type TEXT,
    priority_suggested TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_transcripts_staff_select" ON public.call_transcripts FOR
SELECT USING (auth.uid () IS NOT NULL);

CREATE POLICY "call_transcripts_admin_write" ON public.call_transcripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::TEXT AND role = 'admin'
    )
  );

CREATE POLICY "call_transcripts_anon_insert" ON public.call_transcripts FOR
INSERT
WITH
    CHECK (TRUE);

-- ── 8. UPDATED_AT TRIGGERS ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['emergency_doctors','emergency_calls','ambulances','ambulance_requests']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON public.%s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ── 9. SEED FIRST AID GUIDES ─────────────────────────────────
INSERT INTO public.first_aid_guides (title, description, category, steps, severity_level, icon, color)
VALUES
  (
    'Cardiac Arrest',
    'Sudden loss of heart function, breathing, and consciousness. Every second counts.',
    'Cardiac',
    ARRAY[
      'Call emergency services (120) immediately',
      'Lay the person flat on their back on a firm surface',
      'Start CPR: Place heel of hand on center of chest, push hard and fast (100–120 compressions/min)',
      'Give 2 rescue breaths after every 30 compressions if trained',
      'Use an AED as soon as available and follow its prompts',
      'Continue until emergency services arrive or the person regains consciousness'
    ],
    'critical', 'heart-pulse', 'red'
  ),
  (
    'Severe Bleeding',
    'Uncontrolled bleeding can be life-threatening. Act quickly to stop blood loss.',
    'Trauma',
    ARRAY[
      'Wear gloves if available to protect yourself',
      'Apply firm, direct pressure using a clean cloth or bandage',
      'Do NOT remove the cloth if soaked; add more on top',
      'Elevate the wounded area above the heart level if possible',
      'Apply a tourniquet 2–3 inches above the wound for limb bleeding',
      'Keep the person warm and calm; call 120 if bleeding is severe'
    ],
    'critical', 'droplets', 'red'
  ),
  (
    'Burns',
    'Chemical, thermal or electrical burns require immediate first aid to minimise damage.',
    'Burns',
    ARRAY[
      'Remove the person from the source of the burn immediately',
      'Cool the burn with cool (not cold) running water for 10–20 minutes',
      'Remove jewellery near the burn area carefully',
      'Cover loosely with a sterile dressing or clean cloth — do NOT use ice or butter',
      'Do NOT pop blisters',
      'Seek medical attention for burns larger than a palm or on face/hands/joints'
    ],
    'high', 'flame', 'orange'
  ),
  (
    'Stroke (FAST)',
    'A stroke is a medical emergency. Use the FAST test to identify symptoms.',
    'Neurological',
    ARRAY[
      'F – Face: Ask person to smile. Does one side droop?',
      'A – Arms: Ask them to raise both arms. Does one drift downward?',
      'S – Speech: Ask them to repeat a simple sentence. Is speech slurred?',
      'T – Time: Call 120 immediately if you see ANY of these signs',
      'Note the time symptoms started — critical for treatment decisions',
      'Do NOT give food, water, or medication to the person',
      'Keep them comfortable and still until help arrives'
    ],
    'critical', 'brain', 'purple'
  ),
  (
    'Fracture',
    'A broken bone requires immobilisation to prevent further injury.',
    'Orthopaedic',
    ARRAY[
      'Do NOT try to straighten a broken bone',
      'Immobilise the injured area using a splint or padding',
      'Apply a cold pack wrapped in cloth to reduce swelling',
      'Elevate the injury if it is a limb',
      'Control any bleeding with gentle pressure around (not on) the fracture',
      'Call 120 for open fractures, spinal injuries, or if movement is difficult'
    ],
    'high', 'bone', 'yellow'
  ),
  (
    'Unconsciousness',
    'An unconscious person cannot respond and may need urgent intervention.',
    'General',
    ARRAY[
      'Check for response: tap their shoulder and shout "Are you OK?"',
      'Call 120 immediately if no response',
      'Open the airway: tilt head back gently and lift the chin',
      'Check for breathing for no more than 10 seconds',
      'If not breathing normally, start CPR immediately',
      'If breathing, place in recovery position (on their side)',
      'Monitor breathing until emergency services arrive'
    ],
    'critical', 'activity', 'red'
  )
ON CONFLICT DO NOTHING;

-- ── 10. SEED AMBULANCES (Demo Data) ──────────────────────────
INSERT INTO
    public.ambulances (
        driver_name,
        driver_phone,
        vehicle_number,
        status,
        current_latitude,
        current_longitude
    )
VALUES (
        'Rajesh Kumar',
        '+91-9800001111',
        'MH-12-AB-0001',
        'available',
        18.5204,
        73.8567
    ),
    (
        'Suresh Patil',
        '+91-9800002222',
        'MH-12-CD-0002',
        'available',
        18.5314,
        73.8446
    ),
    (
        'Amit Sharma',
        '+91-9800003333',
        'MH-12-EF-0003',
        'offline',
        18.5089,
        73.8699
    ),
    (
        'Pooja Desai',
        '+91-9800004444',
        'MH-12-GH-0004',
        'available',
        18.5424,
        73.8295
    ) ON CONFLICT (vehicle_number) DO NOTHING;

-- Grant realtime access
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_calls;

ALTER PUBLICATION supabase_realtime
ADD
TABLE public.ambulance_requests;

ALTER PUBLICATION supabase_realtime
ADD
TABLE public.ambulance_tracking;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;

ALTER PUBLICATION supabase_realtime
ADD
TABLE public.emergency_doctors;