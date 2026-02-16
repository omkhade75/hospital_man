-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert notifications (for webhooks)
-- Service role bypasses RLS, but explicit policy is good practice if we ever change things
-- Actually, service role always bypasses RLS, so no need for explicit insert policy for it.
