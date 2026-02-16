-- Secure Function to list all users (admins only)
-- Accessing auth.users requires elevated privileges, so we use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_all_users_secure()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    role text,
    full_name text
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
        au.created_at,
        au.last_sign_in_at,
        COALESCE(ur.role::text, 'patient') as role,
        (au.raw_user_meta_data->>'full_name')::text as full_name
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    ORDER BY au.created_at DESC;
END;
$$;
