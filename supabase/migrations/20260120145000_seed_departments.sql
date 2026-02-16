-- Seed Departments if they don't exist
INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Cardiology', 20, 15, 5, 10
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Cardiology');

INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Neurology', 15, 8, 4, 8
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Neurology');

INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Orthopedics', 25, 20, 6, 12
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Orthopedics');

INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Pediatrics', 15, 10, 4, 8
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Pediatrics');

INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Emergency', 30, 10, 8, 20
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Emergency');

INSERT INTO public.departments (name, total_beds, occupied_beds, doctors_count, nurses_count)
SELECT 'Oncology', 10, 5, 3, 6
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Oncology');
