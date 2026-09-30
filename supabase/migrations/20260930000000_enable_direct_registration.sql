-- ==============================================================================
-- 20260930000000_enable_direct_registration.sql
-- DIRECT USER REGISTRATION RPC FOR SUPABASE AUTH & TEST DOMAINS
-- ==============================================================================
-- Description:
--   1. Provides public.register_user(p_email, p_password, p_full_name) as a
--      SECURITY DEFINER function.
--   2. Directly registers users into auth.users with pre-confirmed email status
--      (email_confirmed_at = now()).
--   3. Avoids GoTrue mailer host/DNS MX validation failures on test domains
--      such as example.com (which publish RFC 7505 Null MX records).
--   4. Automatically triggers public.handle_new_user() to create the user's
--      public.profiles record.
--   5. Allows the newly registered user to immediately log in using
--      supabase.auth.signInWithPassword({ email, password }).
-- ==============================================================================

-- Enable pgcrypto extension if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Direct Registration Function
CREATE OR REPLACE FUNCTION public.register_user(
  p_email text,
  p_password text,
  p_full_name text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
  v_email text;
  v_full_name text;
BEGIN
  v_email := lower(trim(COALESCE(p_email, '')));
  v_full_name := trim(COALESCE(p_full_name, ''));

  -- Email format validation
  IF v_email = '' OR v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;

  -- Password length validation
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  -- Duplicate email check
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'An account with this email already exists.';
  END IF;

  -- Generate bcrypt password hash using pgcrypto
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  v_user_id := gen_random_uuid();

  -- Insert user directly into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_full_name, 'name', v_full_name),
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '',
    '',
    '',
    ''
  );

  -- Return created user information
  RETURN jsonb_build_object(
    'id', v_user_id,
    'email', v_email,
    'full_name', v_full_name
  );
END;
$$;

-- Grant execution permissions to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.register_user(text, text, text) TO anon, authenticated, service_role;
