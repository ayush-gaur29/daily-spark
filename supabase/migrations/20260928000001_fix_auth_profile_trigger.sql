-- ==============================================================================
-- FIX SUPABASE AUTH -> PROFILE AUTO-CREATION & ONE-TIME DATA REPAIR
-- ==============================================================================
-- Target: Supabase PostgreSQL (dr-cubie-inspiration)
-- Description:
--   1. Grants necessary schema and table permissions to supabase_auth_admin.
--   2. Updates public.handle_new_user() with explicit SECURITY DEFINER,
--      safe search_path, fallback metadata handling, and conflict resolution.
--   3. Recreates the AFTER INSERT ON auth.users trigger (on_auth_user_created).
--   4. Performs a one-time data repair for any existing users in auth.users
--      (such as verify_1790578631490@gmail.com) that are missing a profile row.
--   5. Creates a diagnostic verification function public.check_auth_profile_sync().
-- ==============================================================================

-- 1. PERMISSIONS FOR AUTH ADMIN
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;

-- 2. HANDLE NEW USER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
BEGIN
  -- Extract full_name / display_name / name safely from raw_user_meta_data
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    ''
  );

  -- Extract avatar_url safely from raw_user_meta_data
  v_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    ''
  );

  -- Safe upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    role,
    is_vip,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    v_full_name,
    new.email,
    v_avatar_url,
    'user',
    false,
    COALESCE(new.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = CASE
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    avatar_url = CASE
      WHEN EXCLUDED.avatar_url IS NOT NULL AND EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url
      ELSE public.profiles.avatar_url
    END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning so trigger never crashes auth signup unexpectedly
    RAISE WARNING 'handle_new_user trigger error for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 3. RECREATE TRIGGER ON auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ONE-TIME DATA REPAIR FOR EXISTING AUTH USERS
-- Safely inserts a matching profile row for any existing user in auth.users
-- using the exact same UUID (u.id).
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  avatar_url,
  role,
  is_vip,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'name',
    'Dr. Test User'
  ),
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  'user',
  false,
  COALESCE(u.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE
SET
  full_name = CASE
    WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
    ELSE public.profiles.full_name
  END,
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  updated_at = timezone('utc'::text, now());

-- 5. DIAGNOSTIC VERIFICATION FUNCTION
CREATE OR REPLACE FUNCTION public.check_auth_profile_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_users_count integer;
  v_profiles_count integer;
  v_missing_count integer;
  v_trigger_exists boolean;
  v_test_user_profile jsonb;
BEGIN
  SELECT count(*) INTO v_users_count FROM auth.users;
  SELECT count(*) INTO v_profiles_count FROM public.profiles;

  SELECT count(*) INTO v_missing_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;

  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'role', p.role,
    'is_vip', p.is_vip,
    'created_at', p.created_at
  ) INTO v_test_user_profile
  FROM public.profiles p
  WHERE p.email = 'verify_1790578631490@gmail.com'
  LIMIT 1;

  RETURN jsonb_build_object(
    'auth_users_count', v_users_count,
    'profiles_count', v_profiles_count,
    'missing_profiles_count', v_missing_count,
    'trigger_exists', v_trigger_exists,
    'test_user_profile', v_test_user_profile
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_auth_profile_sync() TO anon, authenticated, service_role;
