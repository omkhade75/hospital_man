-- Fix the overly permissive policy by requiring authentication for callback requests
DROP POLICY IF EXISTS "Anyone can insert callback requests" ON public.callback_requests;

-- Authenticated users can insert callback requests
CREATE POLICY "Authenticated users can insert callback requests"
ON public.callback_requests
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);