-- Create notifications table for admin notifications
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    entity_type TEXT, -- 'appointment', 'patient', 'department', 'callback', etc.
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID -- null means it's for all admins
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can insert notifications (for when actions happen)
CREATE POLICY "Staff can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to auto-create notifications on data changes
CREATE OR REPLACE FUNCTION public.create_notification_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Appointment Created',
    'A new appointment has been scheduled',
    'info',
    'appointment',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.create_notification_on_patient()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Patient Registered',
    'A new patient ' || NEW.name || ' has been registered',
    'success',
    'patient',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_notification_on_staff_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Staff Approval Request',
    'Staff member ' || NEW.full_name || ' requested access as ' || NEW.requested_role,
    'warning',
    'staff_approval',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER notify_on_appointment_insert
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_on_appointment();

CREATE TRIGGER notify_on_callback_insert
AFTER INSERT ON public.callback_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_on_callback();

CREATE TRIGGER notify_on_patient_insert
AFTER INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_on_patient();

CREATE TRIGGER notify_on_staff_request_insert
AFTER INSERT ON public.staff_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_on_staff_request();