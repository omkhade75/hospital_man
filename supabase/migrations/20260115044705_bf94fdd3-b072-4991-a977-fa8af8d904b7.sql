-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'doctor', 'nurse', 'receptionist')
  )
$$;

-- Create profiles table for user info
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name text,
    email text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add user_id to chat_messages for ownership tracking
ALTER TABLE public.chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all access to doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;
DROP POLICY IF EXISTS "Allow all access to beds" ON public.beds;
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON public.chat_messages;

-- Appointments: Staff can view and manage
CREATE POLICY "Staff can view appointments"
    ON public.appointments FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update appointments"
    ON public.appointments FOR UPDATE
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete appointments"
    ON public.appointments FOR DELETE
    USING (public.is_staff(auth.uid()));

-- Patients: Staff can view and manage
CREATE POLICY "Staff can view patients"
    ON public.patients FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert patients"
    ON public.patients FOR INSERT
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update patients"
    ON public.patients FOR UPDATE
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete patients"
    ON public.patients FOR DELETE
    USING (public.is_staff(auth.uid()));

-- Doctors: Staff can view, admins can manage
CREATE POLICY "Staff can view doctors"
    ON public.doctors FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert doctors"
    ON public.doctors FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctors"
    ON public.doctors FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctors"
    ON public.doctors FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Departments: Staff can view, admins can manage
CREATE POLICY "Staff can view departments"
    ON public.departments FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert departments"
    ON public.departments FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update departments"
    ON public.departments FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete departments"
    ON public.departments FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Beds: Staff can view, admins/nurses can manage
CREATE POLICY "Staff can view beds"
    ON public.beds FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admin or nurse can insert beds"
    ON public.beds FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admin or nurse can update beds"
    ON public.beds FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'nurse'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admins can delete beds"
    ON public.beds FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages: Users can only access their own
CREATE POLICY "Users can view own chat messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();