-- FIX ADMIN CREDENTIALS
DO $$
DECLARE
  target_email text := 'om123@gmail.com';
  target_pass text := '123456789';
  uid uuid;
BEGIN
  -- 1. Check if user exists
  SELECT id INTO uid FROM auth.users WHERE email = target_email;

  IF uid IS NULL THEN
    -- Create new user
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, is_super_admin
    ) VALUES (
      uid, '00000000-0000-0000-0000-000000000000', 
      'authenticated', 'authenticated', target_email, 
      crypt(target_pass, gen_salt('bf')), now(), 
      '{"provider":"email","providers":["email"]}', '{"full_name":"Om Admin"}', 
      now(), now(), false
    );
  ELSE
    -- Update existing user password
    UPDATE auth.users 
    SET encrypted_password = crypt(target_pass, gen_salt('bf')),
        updated_at = now()
    WHERE id = uid;
  END IF;

  -- 2. Ensure admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Ensure profile
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (uid, uid, target_email, 'Om Admin')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Om Admin';

  RAISE NOTICE 'Admin user % set with password %', target_email, target_pass;
END $$;