-- Ensure Public (anon) and Authenticated users can view departments and doctors
-- This is critical for the booking form to querying these tables

-- 1. Policies for Departments
DROP POLICY IF EXISTS "Public can view departments" ON public.departments;
CREATE POLICY "Public can view departments" 
ON public.departments FOR SELECT 
TO public 
USING (true);

-- 2. Policies for Doctors
DROP POLICY IF EXISTS "Public can view doctors" ON public.doctors;
CREATE POLICY "Public can view doctors" 
ON public.doctors FOR SELECT 
TO public 
USING (true);

-- 3. Ensure RLS is enabled (Policies only work if RLS is on)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 4. Grant explicit SELECT permissions just in case
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT SELECT ON public.doctors TO anon, authenticated;
