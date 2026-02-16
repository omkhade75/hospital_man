-- Fix: Update get_all_users_secure to include encrypted_password
-- and create admin_reset_password function

-- 1. Drop and recreate get_all_users_secure with encrypted_password field
DROP FUNCTION IF EXISTS public.get_all_users_secure();

CREATE OR REPLACE FUNCTION public.get_all_users_secure()
RETURNS TABLE (
    id uuid,
    email text,
    encrypted_password text,
    role text,
    full_name text,
    created_at timestamptz,
    last_sign_in_at timestamptz
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the requesting user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Administrators can view the User Directory.';
    END IF;

    RETURN QUERY
    SELECT
        au.id,
        au.email::text,
        au.encrypted_password::text,  -- Added this field
        COALESCE(ur.role::text, 'patient') as role,
        COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name')::text, 'Unknown') as full_name,
        au.created_at,
        au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    LEFT JOIN public.profiles p ON au.id = p.user_id
    ORDER BY au.created_at DESC;
END;
$$;

-- 2. Create admin_reset_password function
-- Extension required for password hashing (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC Function: Allows an ADMIN to force-reset any user's password
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Security Check: Ensure the person running this is actually an Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Administrators can perform forced password resets.';
    END IF;

    -- 2. Perform the Update
    -- We use 'crypt' with 'bf' (Blowfish/bcrypt) which is the standard Supabase auth encryption
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = target_user_id;

    -- 3. Verify the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User ID % not found', target_user_id;
    END IF;
END;
$$;
