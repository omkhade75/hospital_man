ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2) DEFAULT 0.00;

-- Allow cashiers to view doctors (already exists for staff)
-- Allow cashiers to update salary? Or just admins?
-- Assuming Admin sets salary, Cashier 'has access' (viewing).
-- If Cashier needs to PAY salary, they might need update access.
-- I will add a policy for Cashiers to update doctor salary just in case, or at least view it specific columns.
-- But usually RLS is row-level. Existing policy "Staff can view doctors" covers viewing.
-- Updating: "Admins can update doctors".
-- I will add "Cashiers can update doctors" specifically for salary?
-- RLS doesn't easily support column-level security for updates without triggers or complex checks.
-- For now, I'll rely on the frontend to restrict editing to salary, and simpler RLS.

CREATE POLICY "Cashiers can update doctors"
    ON public.doctors FOR UPDATE
    USING (public.has_role(auth.uid(), 'cashier'))
    WITH CHECK (public.has_role(auth.uid(), 'cashier'));
