
-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  head_doctor TEXT,
  total_beds INTEGER DEFAULT 0,
  occupied_beds INTEGER DEFAULT 0,
  doctors_count INTEGER DEFAULT 0,
  nurses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  total_patients INTEGER DEFAULT 0,
  phone TEXT,
  email TEXT,
  available BOOLEAN DEFAULT true,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  condition TEXT,
  status TEXT DEFAULT 'outpatient',
  room TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  admitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 30,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds table
CREATE TABLE public.beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bed_number TEXT NOT NULL,
  room_number TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'available',
  bed_type TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table for Maya
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo - in production, add auth)
CREATE POLICY "Allow all access to departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to beds" ON public.beds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate patient ID
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 2) AS INTEGER)), 0) + 1 
  INTO next_id 
  FROM public.patients;
  NEW.patient_id := 'P' || LPAD(next_id::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_patient_id BEFORE INSERT ON public.patients FOR EACH ROW WHEN (NEW.patient_id IS NULL) EXECUTE FUNCTION public.generate_patient_id();

-- Insert sample departments
INSERT INTO public.departments (name, head_doctor, total_beds, occupied_beds, doctors_count, nurses_count) VALUES
('Cardiology', 'Dr. Sarah Wilson', 60, 45, 12, 24),
('Neurology', 'Dr. Michael Chen', 40, 32, 8, 16),
('Orthopedics', 'Dr. Lisa Anderson', 50, 38, 10, 20),
('Pediatrics', 'Dr. James Miller', 70, 52, 15, 30),
('Emergency', 'Dr. David Martinez', 50, 35, 20, 40),
('Oncology', 'Dr. Emily Brown', 45, 28, 8, 18);

-- Insert sample doctors
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. Sarah Wilson', 'Cardiology', '15 years', 4.9, 1250, '+1 234-567-8901', 'sarah.wilson@hospital.com', true, id FROM public.departments WHERE name = 'Cardiology';
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. Michael Chen', 'Neurology', '12 years', 4.8, 980, '+1 234-567-8902', 'michael.chen@hospital.com', true, id FROM public.departments WHERE name = 'Neurology';
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. Lisa Anderson', 'Orthopedics', '10 years', 4.7, 850, '+1 234-567-8903', 'lisa.anderson@hospital.com', false, id FROM public.departments WHERE name = 'Orthopedics';
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. James Miller', 'Pediatrics', '18 years', 4.9, 2100, '+1 234-567-8904', 'james.miller@hospital.com', true, id FROM public.departments WHERE name = 'Pediatrics';
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. Emily Brown', 'Oncology', '14 years', 4.8, 720, '+1 234-567-8905', 'emily.brown@hospital.com', true, id FROM public.departments WHERE name = 'Oncology';
INSERT INTO public.doctors (name, specialty, experience, rating, total_patients, phone, email, available, department_id) 
SELECT 'Dr. David Martinez', 'Emergency Medicine', '11 years', 4.7, 890, '+1 234-567-8906', 'david.martinez@hospital.com', true, id FROM public.departments WHERE name = 'Emergency';
