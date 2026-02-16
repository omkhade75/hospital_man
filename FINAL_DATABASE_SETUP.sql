-- Database Improvements and Fixes for Star Hospital

-- 1. Create staff_salaries table if not exists
CREATE TABLE IF NOT EXISTS public.staff_salaries (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) NOT NULL UNIQUE,
    salary numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_salaries' AND policyname = 'Admins can manage salaries') THEN
        CREATE POLICY "Admins can manage salaries" ON public.staff_salaries
            FOR ALL
            USING (
              EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
              )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_salaries' AND policyname = 'Staff can view own salary') THEN
        CREATE POLICY "Staff can view own salary" ON public.staff_salaries
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Create insurance_claims table if not exists
CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    provider text NOT NULL,
    policy_number text NOT NULL,
    patient_name text NOT NULL,
    diagnosis text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'Everyone can view claims') THEN
        CREATE POLICY "Everyone can view claims" ON public.insurance_claims FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'Admins can manage claims') THEN
        CREATE POLICY "Admins can manage claims" ON public.insurance_claims FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 3. Create nurse_rounds table if not exists
CREATE TABLE IF NOT EXISTS public.nurse_rounds (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    doctor_id uuid REFERENCES public.doctors (id),
    doctor_name text, -- Denormalized for ease
    specialty text,
    round_time text,
    ward text,
    patients_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.nurse_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view rounds" ON public.nurse_rounds FOR
SELECT USING (true);

-- 4. Create medical_advice table
CREATE TABLE IF NOT EXISTS public.medical_advice (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    patient_name text NOT NULL,
    doctor_name text NOT NULL,
    advice text NOT NULL,
    acknowledged boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medical_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view advice" ON public.medical_advice FOR
SELECT USING (true);

CREATE POLICY "Nurses can update advice" ON public.medical_advice FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role IN ('nurse', 'admin')
    )
);

-- Seed some data for Nurse Rounds if empty
INSERT INTO
    public.nurse_rounds (
        doctor_name,
        specialty,
        round_time,
        ward,
        patients_count
    )
SELECT 'Dr. Sarah Wilson', 'Cardiology', '10:00 AM', 'Cardiology Wing A', 5
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.nurse_rounds
        WHERE
            doctor_name = 'Dr. Sarah Wilson'
    );

INSERT INTO
    public.nurse_rounds (
        doctor_name,
        specialty,
        round_time,
        ward,
        patients_count
    )
SELECT 'Dr. James Miller', 'Pediatrics', '11:30 AM', 'Pediatric Ward', 8
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.nurse_rounds
        WHERE
            doctor_name = 'Dr. James Miller'
    );

-- Seed medical advice
INSERT INTO
    public.medical_advice (
        patient_name,
        doctor_name,
        advice
    )
SELECT 'John Doe', 'Dr. Sarah Wilson', 'Monitor BP every 2 hours. Increase fluid intake.'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.medical_advice
        WHERE
            patient_name = 'John Doe'
    );