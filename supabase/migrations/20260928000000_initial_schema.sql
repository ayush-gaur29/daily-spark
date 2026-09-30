-- ==============================================================================
-- DR. CUBIE INSPIRATION - DATABASE & STORAGE FOUNDATION SCHEMA
-- ==============================================================================
-- Target: Supabase PostgreSQL (dr-cubie-inspiration)
-- Description: Core tables, foreign keys, constraints, RLS policies, triggers,
--              and storage buckets for common and user-specific data.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. USER PROFILES TABLE (User-Specific)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, is_vip)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'user',
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 3. VIDEOS TABLE (Common / Global Content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration text,
  duration_seconds integer,
  category text NOT NULL DEFAULT 'Mindfulness',
  is_vip boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_videos_updated_at ON public.videos;
CREATE TRIGGER set_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 4. AUDIOS TABLE (Common / Global Content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  audio_url text NOT NULL,
  duration text,
  duration_seconds integer,
  category text NOT NULL DEFAULT 'Mindfulness',
  speaker text DEFAULT 'Voice of Dr. Cubie',
  thumbnail_url text,
  is_vip boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_audios_updated_at ON public.audios;
CREATE TRIGGER set_audios_updated_at
  BEFORE UPDATE ON public.audios
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 5. SPARKS TABLE (Common / Global Content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sparks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  title text NOT NULL,
  short_description text,
  category text NOT NULL DEFAULT 'Mindfulness',
  duration text,
  thumbnail_url text,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  audio_id uuid REFERENCES public.audios(id) ON DELETE SET NULL,
  reflection text,
  insight text,
  practice text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_vip boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_sparks_updated_at ON public.sparks;
CREATE TRIGGER set_sparks_updated_at
  BEFORE UPDATE ON public.sparks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 6. DAILY CONTENT TABLE (Admin Management / Global Content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_date date NOT NULL UNIQUE,
  spark_id uuid NOT NULL REFERENCES public.sparks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_daily_content_updated_at ON public.daily_content;
CREATE TRIGGER set_daily_content_updated_at
  BEFORE UPDATE ON public.daily_content
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 7. RECOMMENDATIONS TABLE (Admin Curated / Global Content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'audio', 'spark')),
  content_id uuid NOT NULL,
  category text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_recommendations_updated_at ON public.recommendations;
CREATE TRIGGER set_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 8. SAVED CONTENT TABLE (User-Specific)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('spark', 'video', 'audio')),
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_saved_content UNIQUE (user_id, content_type, content_id)
);

-- ==============================================================================
-- 9. USER CONTENT ACTIVITY TABLE (User-Specific / Progress Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.content_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('spark', 'video', 'audio')),
  content_id uuid NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_played_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_content_activity UNIQUE (user_id, content_type, content_id)
);

DROP TRIGGER IF EXISTS set_content_activity_updated_at ON public.content_activity;
CREATE TRIGGER set_content_activity_updated_at
  BEFORE UPDATE ON public.content_activity
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 10. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_sparks_category ON public.sparks(category);
CREATE INDEX IF NOT EXISTS idx_sparks_status ON public.sparks(status);
CREATE INDEX IF NOT EXISTS idx_sparks_is_vip ON public.sparks(is_vip);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_audios_category ON public.audios(category);
CREATE INDEX IF NOT EXISTS idx_audios_status ON public.audios(status);
CREATE INDEX IF NOT EXISTS idx_daily_content_date ON public.daily_content(content_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON public.recommendations(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_saved_content_user ON public.saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_activity_user ON public.content_activity(user_id);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_activity ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can view user profiles (e.g. for author / avatar display)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can update only their own profile, Admins can update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Only admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- VIDEOS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Published videos are readable by all" ON public.videos;
CREATE POLICY "Published videos are readable by all"
  ON public.videos FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert videos" ON public.videos;
CREATE POLICY "Admins can insert videos"
  ON public.videos FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update videos" ON public.videos;
CREATE POLICY "Admins can update videos"
  ON public.videos FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;
CREATE POLICY "Admins can delete videos"
  ON public.videos FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- AUDIOS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Published audios are readable by all" ON public.audios;
CREATE POLICY "Published audios are readable by all"
  ON public.audios FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audios" ON public.audios;
CREATE POLICY "Admins can insert audios"
  ON public.audios FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update audios" ON public.audios;
CREATE POLICY "Admins can update audios"
  ON public.audios FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete audios" ON public.audios;
CREATE POLICY "Admins can delete audios"
  ON public.audios FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- SPARKS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Published sparks are readable by all" ON public.sparks;
CREATE POLICY "Published sparks are readable by all"
  ON public.sparks FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert sparks" ON public.sparks;
CREATE POLICY "Admins can insert sparks"
  ON public.sparks FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update sparks" ON public.sparks;
CREATE POLICY "Admins can update sparks"
  ON public.sparks FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete sparks" ON public.sparks;
CREATE POLICY "Admins can delete sparks"
  ON public.sparks FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- DAILY CONTENT POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Published daily content is readable by all" ON public.daily_content;
CREATE POLICY "Published daily content is readable by all"
  ON public.daily_content FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert daily content" ON public.daily_content;
CREATE POLICY "Admins can insert daily content"
  ON public.daily_content FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update daily content" ON public.daily_content;
CREATE POLICY "Admins can update daily content"
  ON public.daily_content FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete daily content" ON public.daily_content;
CREATE POLICY "Admins can delete daily content"
  ON public.daily_content FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RECOMMENDATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Active recommendations are readable by all" ON public.recommendations;
CREATE POLICY "Active recommendations are readable by all"
  ON public.recommendations FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert recommendations" ON public.recommendations;
CREATE POLICY "Admins can insert recommendations"
  ON public.recommendations FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update recommendations" ON public.recommendations;
CREATE POLICY "Admins can update recommendations"
  ON public.recommendations FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete recommendations" ON public.recommendations;
CREATE POLICY "Admins can delete recommendations"
  ON public.recommendations FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- SAVED CONTENT POLICIES (Strict User Isolation)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view only their own saved content" ON public.saved_content;
CREATE POLICY "Users can view only their own saved content"
  ON public.saved_content FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own saved content" ON public.saved_content;
CREATE POLICY "Users can insert their own saved content"
  ON public.saved_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved content" ON public.saved_content;
CREATE POLICY "Users can delete their own saved content"
  ON public.saved_content FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- CONTENT ACTIVITY POLICIES (Strict User Isolation)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view only their own activity" ON public.content_activity;
CREATE POLICY "Users can view only their own activity"
  ON public.content_activity FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own activity" ON public.content_activity;
CREATE POLICY "Users can insert their own activity"
  ON public.content_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activity" ON public.content_activity;
CREATE POLICY "Users can update their own activity"
  ON public.content_activity FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own activity" ON public.content_activity;
CREATE POLICY "Users can delete their own activity"
  ON public.content_activity FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 12. STORAGE BUCKETS SETUP
-- ==============================================================================

-- Create buckets in storage.buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('audio', 'audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg']),
  ('thumbnails', 'thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- STORAGE RLS POLICIES
-- ------------------------------------------------------------------------------

-- Allow public read access to all public buckets
DROP POLICY IF EXISTS "Public bucket objects are viewable by all" ON storage.objects;
CREATE POLICY "Public bucket objects are viewable by all"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('videos', 'audio', 'thumbnails', 'avatars'));

-- Admin upload access for videos, audio, thumbnails
DROP POLICY IF EXISTS "Admins can upload videos, audio, thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload videos, audio, thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('videos', 'audio', 'thumbnails') 
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update videos, audio, thumbnails" ON storage.objects;
CREATE POLICY "Admins can update videos, audio, thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('videos', 'audio', 'thumbnails') 
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete videos, audio, thumbnails" ON storage.objects;
CREATE POLICY "Admins can delete videos, audio, thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('videos', 'audio', 'thumbnails') 
    AND public.is_admin()
  );

-- Users can upload and manage their own avatar in avatars bucket (e.g. avatars/{userId}/*)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR public.is_admin()
    )
  );

-- ==============================================================================
-- 13. MINIMAL SAFE TEST / SEED RECORD (OPTIONAL VERIFICATION)
-- ==============================================================================
-- Safe demonstration seed to verify constraint validity and relationships
DO $$
DECLARE
  v_video_id uuid;
  v_audio_id uuid;
  v_spark_id uuid;
BEGIN
  -- Only insert if sparks table is empty
  IF NOT EXISTS (SELECT 1 FROM public.sparks LIMIT 1) THEN
    -- 1. Sample Video
    INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status)
    VALUES (
      'The Architecture of Quiet Clarity',
      'Daily morning contemplation on intentional stillness and deliberate focus.',
      '/assets/videos/daily-motivation.mp4',
      '/assets/images/hero-quiet-clarity.jpg',
      '0:30',
      30,
      'Mindfulness',
      false,
      'published'
    ) RETURNING id INTO v_video_id;

    -- 2. Sample Audio
    INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, is_vip, status)
    VALUES (
      'Guided Contemplation',
      '432Hz Calm Resonance focused on constructing mental spaciousness.',
      '',
      '4 min',
      255,
      'Mindfulness',
      'Voice of Dr. Cubie',
      false,
      'published'
    ) RETURNING id INTO v_audio_id;

    -- 3. Sample Spark
    INSERT INTO public.sparks (slug, title, short_description, category, duration, thumbnail_url, video_id, audio_id, reflection, insight, practice, is_vip, status)
    VALUES (
      'the-architecture-of-quiet-clarity',
      'The Architecture of Quiet Clarity',
      'Why intentional stillness builds resilient decisions in demanding environments.',
      'Mindfulness',
      '4 min',
      '/assets/images/hero-quiet-clarity.jpg',
      v_video_id,
      v_audio_id,
      'Cognitive overload blurs the boundary between urgency and genuine importance.',
      'Stillness protects cognitive energy before high-stakes choices.',
      'Take three uninterrupted breaths before opening your morning communications.',
      false,
      'published'
    ) RETURNING id INTO v_spark_id;

    -- 4. Sample Daily Content for today
    INSERT INTO public.daily_content (content_date, spark_id, status)
    VALUES (CURRENT_DATE, v_spark_id, 'published')
    ON CONFLICT (content_date) DO NOTHING;

    -- 5. Sample Recommendation
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES (
      'The Architecture of Quiet Clarity',
      'spark',
      v_spark_id,
      'Mindfulness',
      1,
      true
    );
  END IF;
END $$;
