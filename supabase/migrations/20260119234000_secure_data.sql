-- Secure Data Migration
-- 1. Create a secure table for sensitive doctor financial data
CREATE TABLE public.doctor_salaries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(doctor_id)
);

-- 2. Move existing salary data (if any)
INSERT INTO public.doctor_salaries (doctor_id, salary)
SELECT id, salary FROM public.doctors WHERE salary IS NOT NULL;

-- 3. Drop the insecure column from the public table
ALTER TABLE public.doctors DROP COLUMN salary;

-- 4. Enable Security on new table
ALTER TABLE public.doctor_salaries ENABLE ROW LEVEL SECURITY;

-- 5. Strict Policies for Salaries: ONLY ADMINS
CREATE POLICY "Admins can view salaries"
ON public.doctor_salaries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert salaries"
ON public.doctor_salaries
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update salaries"
ON public.doctor_salaries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete salaries"
ON public.doctor_salaries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Lock down the main doctors table (Revoke the 'Allow all' policy)
DROP POLICY IF EXISTS "Allow all access to doctors" ON public.doctors;

-- Allow Public Read Access to Doctors (Basic Info is public)
CREATE POLICY "Public can view doctors"
ON public.doctors
FOR SELECT
USING (true);

-- Allow Staff/Admins to Modify Doctors
CREATE POLICY "Admins can manage doctors"
ON public.doctors
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Lock down Patients table (It was 'Allow all'!)
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;

-- Staff View All
CREATE POLICY "Staff view all patients"
ON public.patients
FOR SELECT
USING (public.is_staff(auth.uid()));

-- Staff/Admin Update
CREATE POLICY "Staff update patients"
ON public.patients
FOR UPDATE
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Users view their own Linked Patient record
-- (Assuming patient_id linkage logic exists, usually handled via patient_accounts)
