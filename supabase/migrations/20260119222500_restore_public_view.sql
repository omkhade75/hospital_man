-- Restore public access for doctors and departments (required for landing page and patient dashboard)
-- Note: 'Staff can view ...' policies exist, but we need broad read access for these basic catalog tables.

DROP POLICY IF EXISTS "Public can view doctors" ON public.doctors;
CREATE POLICY "Public can view doctors" ON public.doctors
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view departments" ON public.departments;
CREATE POLICY "Public can view departments" ON public.departments
FOR SELECT USING (true);
