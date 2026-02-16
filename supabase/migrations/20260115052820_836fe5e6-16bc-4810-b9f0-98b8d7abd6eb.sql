-- Create patient_accounts table to link patients with user accounts
CREATE TABLE public.patient_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient_accounts
ALTER TABLE public.patient_accounts ENABLE ROW LEVEL SECURITY;

-- Patient accounts policies
CREATE POLICY "Users can view own patient account"
ON public.patient_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patient account"
ON public.patient_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patient account"
ON public.patient_accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff can view all patient accounts
CREATE POLICY "Staff can view all patient accounts"
ON public.patient_accounts
FOR SELECT
USING (is_staff(auth.uid()));

-- Create staff_approval_requests table for approval workflow
CREATE TABLE public.staff_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  requested_role app_role NOT NULL DEFAULT 'receptionist',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on staff_approval_requests
ALTER TABLE public.staff_approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own approval request
CREATE POLICY "Users can view own approval request"
ON public.staff_approval_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own approval request
CREATE POLICY "Users can insert own approval request"
ON public.staff_approval_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all approval requests
CREATE POLICY "Admins can view all approval requests"
ON public.staff_approval_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update approval requests (approve/reject)
CREATE POLICY "Admins can update approval requests"
ON public.staff_approval_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create callback_requests table for patient callback requests
CREATE TABLE public.callback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_time TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on callback_requests
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert callback requests (even unauthenticated for general inquiries)
CREATE POLICY "Anyone can insert callback requests"
ON public.callback_requests
FOR INSERT
WITH CHECK (true);

-- Users can view their own callback requests
CREATE POLICY "Users can view own callback requests"
ON public.callback_requests
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Staff can view all callback requests
CREATE POLICY "Staff can view all callback requests"
ON public.callback_requests
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can update callback requests
CREATE POLICY "Staff can update callback requests"
ON public.callback_requests
FOR UPDATE
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Create function to check if user is a patient (not staff)
CREATE OR REPLACE FUNCTION public.is_patient(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_accounts
    WHERE user_id = _user_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Create function to check staff approval status
CREATE OR REPLACE FUNCTION public.get_staff_approval_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.staff_approval_requests WHERE user_id = _user_id),
    'none'
  )
$$;

-- Create patient appointments table for patient-booked appointments
CREATE TABLE public.patient_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  doctor_id UUID REFERENCES public.doctors(id),
  department_id UUID REFERENCES public.departments(id),
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  appointment_type TEXT NOT NULL DEFAULT 'consultation',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient_appointments
ALTER TABLE public.patient_appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own patient appointments
CREATE POLICY "Users can view own patient appointments"
ON public.patient_appointments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own patient appointments
CREATE POLICY "Users can insert own patient appointments"
ON public.patient_appointments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending appointments
CREATE POLICY "Users can update own pending appointments"
ON public.patient_appointments
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Staff can view all patient appointments
CREATE POLICY "Staff can view all patient appointments"
ON public.patient_appointments
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can update all patient appointments
CREATE POLICY "Staff can update all patient appointments"
ON public.patient_appointments
FOR UPDATE
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_patient_accounts_updated_at
BEFORE UPDATE ON public.patient_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_approval_requests_updated_at
BEFORE UPDATE ON public.staff_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_callback_requests_updated_at
BEFORE UPDATE ON public.callback_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_appointments_updated_at
BEFORE UPDATE ON public.patient_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();