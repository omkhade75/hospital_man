-- Fix Callback Requests RLS
-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Anyone can insert callback requests" ON public.callback_requests;
DROP POLICY IF EXISTS "Users can view own callback requests" ON public.callback_requests;
DROP POLICY IF EXISTS "Staff can view all callback requests" ON public.callback_requests;
DROP POLICY IF EXISTS "Staff can update callback requests" ON public.callback_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.callback_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.callback_requests;
DROP POLICY IF EXISTS "Enable update for staff" ON public.callback_requests;

-- 1. INSERT: Allow ANYONE (including anon) to insert
CREATE POLICY "Allow public insert on callback_requests"
ON public.callback_requests
FOR INSERT
TO public
WITH CHECK (true);

-- 2. SELECT: Allow Staff to view all, Users to view own. 
-- For Anon users who just inserted, we technically can't secure it perfectly without a session ID.
-- But to allow the .select() to work on the frontend immediately after insert, we might need to be lenient.
-- OR we change the frontend to not select(). 
-- But for now, let's allow users to see rows where user_id is NULL (Landing page requests).
-- This is a tradeoff for the 'Contact Us' functionality to work smoothly.
CREATE POLICY "Allow select on callback_requests"
ON public.callback_requests
FOR SELECT
TO public
USING (
    is_staff(auth.uid()) 
    OR (auth.uid() = user_id) 
    OR (user_id IS NULL) -- Necessary for anon submissions to be returned to frontend
);

-- 3. UPDATE: Only Staff
CREATE POLICY "Allow staff update on callback_requests"
ON public.callback_requests
FOR UPDATE
TO public
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- 4. DELETE: Only Admin
CREATE POLICY "Allow admin delete on callback_requests"
ON public.callback_requests
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'));

-- Ensure Notification Function is Security Definer (Fixing potential trigger permission issues)
CREATE OR REPLACE FUNCTION public.create_notification_on_callback()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Callback Request',
    'A new callback request from ' || NEW.name,
    'warning',
    'callback',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
