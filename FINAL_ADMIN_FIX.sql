-- FINAL ADMIN ACCOUNT REPAIR SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

DO $$
DECLARE
  target_email text := 'om123@gmail.com';
  target_pass text := '123456789';
  target_uid uuid;
BEGIN
  -- 1. DELETE EXISTING ENTRIES TO START FRESH (Safe for this specific user)
  DELETE FROM auth.users WHERE email = target_email;

  -- 2. CREATE THE USER IN AUTH.USERS
  target_uid := gen_random_uuid();
  INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    is_super_admin, 
    created_at, 
    updated_at,
    last_sign_in_at,
    confirmation_token
  ) VALUES (
    target_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_pass, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', 'Om Admin', 'role', 'admin'), -- Crucial for AuthContext
    false,
    now(),
    now(),
    now(),
    ''
  );

  -- 3. ASSIGN THE ADMIN ROLE IN PUBLIC.USER_ROLES
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. ENSURE PROFILE EXISTS
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (target_uid, target_uid, target_email, 'Om Admin')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Om Admin';

  RAISE NOTICE 'SUCCESS: Admin user % created and assigned admin role.', target_email;
END $$;