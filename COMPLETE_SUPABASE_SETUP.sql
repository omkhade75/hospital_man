-- COMPLETE SUPABASE SETUP SCRIPT (WITH ADMIN USER)
-- Run this ENTIRE script in the Supabase SQL Editor.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist', 'cashier');

EXCEPTION WHEN duplicate_object THEN null;

END $$;

-- 3. Create Tables

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    email text,
    full_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.departments (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    name text NOT NULL,
    head_doctor text,
    doctors_count integer DEFAULT 0,
    nurses_count integer DEFAULT 0,
    total_beds integer DEFAULT 0,
    occupied_beds integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doctors (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    name text NOT NULL,
    specialty text NOT NULL,
    department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
    email text,
    phone text,
    experience text,
    rating numeric DEFAULT 0,
    total_patients integer DEFAULT 0,
    available boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patients (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    patient_id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    age integer,
    gender text,
    address text,
    condition text,
    status text DEFAULT 'Active',
    room text,
    admitted_at timestamptz,
    department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
    doctor_id uuid REFERENCES public.doctors (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    patient_id uuid REFERENCES public.patients (id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES public.doctors (id) ON DELETE SET NULL,
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    duration integer DEFAULT 30,
    type text DEFAULT 'Consultation',
    status text DEFAULT 'Scheduled',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_appointments (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    patient_name text NOT NULL,
    patient_email text,
    patient_phone text,
    department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
    doctor_id uuid REFERENCES public.doctors (id) ON DELETE SET NULL,
    preferred_date date NOT NULL,
    preferred_time time,
    appointment_type text DEFAULT 'Consultation',
    status text DEFAULT 'Pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medical_reports (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    patient_id uuid REFERENCES public.patients (id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    report_type text NOT NULL,
    description text,
    file_url text NOT NULL,
    uploaded_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beds (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    room_number text NOT NULL,
    bed_number text NOT NULL,
    bed_type text,
    status text DEFAULT 'Available',
    department_id uuid REFERENCES public.departments (id) ON DELETE CASCADE,
    patient_id uuid REFERENCES public.patients (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_approval_requests (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    requested_role app_role NOT NULL,
    status text DEFAULT 'Pending',
    reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.callback_requests (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    reason text,
    preferred_time text,
    status text DEFAULT 'Pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    is_read boolean DEFAULT false,
    entity_type text,
    entity_id uuid,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    session_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_salaries (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE UNIQUE NOT NULL,
    salary numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.nurse_rounds (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    doctor_id uuid REFERENCES public.doctors (id) ON DELETE SET NULL,
    doctor_name text,
    specialty text,
    round_time text,
    ward text,
    patients_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medical_advice (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    patient_name text NOT NULL,
    doctor_name text NOT NULL,
    advice text NOT NULL,
    acknowledged boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_accounts (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients (id) ON DELETE CASCADE,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    amount numeric NOT NULL,
    description text,
    patient_name text,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patient_appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.staff_approval_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.nurse_rounds ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.medical_advice ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patient_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drops old ones first to avoid errors)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Everyone can read roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Departments viewable by everyone" ON public.departments;
    DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
    DROP POLICY IF EXISTS "Doctors viewable by everyone" ON public.doctors;
    DROP POLICY IF EXISTS "Admins manage doctors" ON public.doctors;
    DROP POLICY IF EXISTS "Staff view patients" ON public.patients;
    DROP POLICY IF EXISTS "Staff view appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Users view own appt requests" ON public.patient_appointments;
    DROP POLICY IF EXISTS "Users create appt requests" ON public.patient_appointments;
    DROP POLICY IF EXISTS "Users request staff approval" ON public.staff_approval_requests;
    DROP POLICY IF EXISTS "Users view own approval" ON public.staff_approval_requests;
    DROP POLICY IF EXISTS "Admins manage approvals" ON public.staff_approval_requests;
    DROP POLICY IF EXISTS "Users insert callbacks" ON public.callback_requests;
    DROP POLICY IF EXISTS "Admins manage callbacks" ON public.callback_requests;
    DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users view own chats" ON public.chat_messages;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Everyone can read roles" ON public.user_roles FOR
SELECT USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Departments viewable by everyone" ON public.departments FOR
SELECT USING (true);

CREATE POLICY "Admins manage departments" ON public.departments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Doctors viewable by everyone" ON public.doctors FOR
SELECT USING (true);

CREATE POLICY "Admins manage doctors" ON public.doctors FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Staff view patients" ON public.patients FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role IN (
                'admin',
                'doctor',
                'nurse',
                'receptionist'
            )
    )
);

CREATE POLICY "Staff view appointments" ON public.appointments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role IN (
                'admin',
                'doctor',
                'nurse',
                'receptionist'
            )
    )
);

CREATE POLICY "Users view own appt requests" ON public.patient_appointments FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users create appt requests" ON public.patient_appointments FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users request staff approval" ON public.staff_approval_requests FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users view own approval" ON public.staff_approval_requests FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Admins manage approvals" ON public.staff_approval_requests FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Users insert callbacks" ON public.callback_requests FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY "Admins manage callbacks" ON public.callback_requests FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Users view own notifications" ON public.notifications FOR ALL USING (auth.uid () = user_id);

CREATE POLICY "Users view own chats" ON public.chat_messages FOR ALL USING (auth.uid () = user_id);

CREATE POLICY "Admins manage salaries" ON public.staff_salaries FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Staff view own salary" ON public.staff_salaries FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Everyone view claims" ON public.insurance_claims FOR
SELECT USING (true);

CREATE POLICY "Admins manage claims" ON public.insurance_claims FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Everyone view rounds" ON public.nurse_rounds FOR
SELECT USING (true);

CREATE POLICY "Everyone view advice" ON public.medical_advice FOR
SELECT USING (true);

CREATE POLICY "Nurses update advice" ON public.medical_advice FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE
            user_id = auth.uid ()
            AND role IN ('nurse', 'admin')
    )
);

CREATE POLICY "Users view own transactions" ON public.transactions FOR
SELECT USING (true);
-- Simplified

-- 6. Functions

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (new.id, new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_patient(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_staff_approval_status(_user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT status FROM public.staff_approval_requests WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_all_users_secure()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    role text,
    full_name text
)
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;
    RETURN QUERY
    SELECT
        au.id,
        au.email::text,
        au.created_at,
        au.last_sign_in_at,
        COALESCE(ur.role::text, 'patient') as role,
        (au.raw_user_meta_data->>'full_name')::text as full_name
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. SEED ADMIN USER (admin@123)
-- This section automatically creates the admin user if it doesn't exist.
DO $$
DECLARE
  new_admin_id uuid := gen_random_uuid();
  admin_email text := 'admin@123.com'; -- Using .com to ensure valid email format
  admin_password text := '123456789';
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      is_super_admin
    ) VALUES (
      new_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Admin"}',
      now(),
      now(),
      '',
      '',
      false
    );

    -- Assign Admin Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_admin_id, 'admin');

    -- Insert Profile (since Auth trigger might not fire inside DO block same way)
    INSERT INTO public.profiles (id, user_id, email, full_name)
    VALUES (new_admin_id, new_admin_id, admin_email, 'System Admin')
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Admin user created: %', admin_email;
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;
END $$;