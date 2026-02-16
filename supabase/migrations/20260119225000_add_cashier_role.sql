-- Add 'cashier' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed',
    payment_method TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
-- 1. Cashier can view all transactions
CREATE POLICY "Cashier can view all transactions" 
ON public.transactions FOR SELECT 
USING (is_staff(auth.uid()) AND has_role(auth.uid(), 'cashier'));

-- 2. Cashier can insert transactions
CREATE POLICY "Cashier can insert transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND has_role(auth.uid(), 'cashier'));

-- 3. Admin can view all transactions
CREATE POLICY "Admin can view all transactions" 
ON public.transactions FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 4. Admin can insert transactions (optional, but good for completeness)
CREATE POLICY "Admin can insert transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert some dummy transactions data for testing
INSERT INTO public.transactions (patient_name, amount, description, payment_method) VALUES
('John Doe', 150.00, 'Consultation Fee', 'Credit Card'),
('Jane Smith', 500.00, 'MRI Scan', 'Insurance'),
('John Doe', 50.00, 'Medicine', 'Cash'),
('Alice Brown', 1200.00, 'Surgery Advance', 'Bank Transfer');
