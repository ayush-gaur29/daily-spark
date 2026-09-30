-- ==============================================================================
-- DR. CUBIE INSPIRATION - CREATE NOTIFICATIONS TABLE & RLS
-- ==============================================================================
-- Migration: 20260928000003_create_notifications.sql
-- Description:
--   1. Creates user-scoped public.notifications table referencing auth.users(id).
--   2. Adds performance indexes for user queries and unread counting.
--   3. Enables and configures Row Level Security (RLS) for strict user isolation.
--   4. Grants permissions to authenticated and service_role roles.
--   5. Registers table to supabase_realtime publication for live UI updates.
-- ==============================================================================

-- 1. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('spark', 'video', 'audio', 'vip', 'general', 'system', 'streak')),
  related_content_id text,
  related_content_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CREATE INDEXES FOR FAST USER & UNREAD LOOKUPS
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications (user_id) 
  WHERE is_read = false;

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Strict User-Specific Isolation)

-- SELECT: Users can only read their own notifications (admins can view all)
DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;
CREATE POLICY "Users can view only their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- UPDATE: Users can only update their own notifications (e.g. mark as read)
DROP POLICY IF EXISTS "Users can update only their own notifications" ON public.notifications;
CREATE POLICY "Users can update only their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- INSERT: Self-scoped insertions or authorized admin flows (prevents user A from inserting for user B)
DROP POLICY IF EXISTS "Users and admins can insert notifications" ON public.notifications;
CREATE POLICY "Users and admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- DELETE: Users can only delete their own notifications (admins can delete any)
DROP POLICY IF EXISTS "Users can delete only their own notifications" ON public.notifications;
CREATE POLICY "Users can delete only their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- 5. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

-- 6. ENABLE REALTIME UPDATES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already in publication
END $$;
