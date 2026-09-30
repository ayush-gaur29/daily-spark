-- ==============================================================================
-- SEED DR. CUBIE INSPIRATION APPLICATION CONTENT
-- ==============================================================================
-- Target: Supabase PostgreSQL (dr-cubie-inspiration)
-- Description:
--   Populates rich published sparks, videos, audios, daily content schedule,
--   and recommendations for the Dr. Cubie Inspiration app.
--   Fully idempotent: safe to execute multiple times.
-- ==============================================================================

DO $$
DECLARE
  -- Video IDs
  v_video_clarity uuid;
  v_video_focus uuid;
  v_video_confidence uuid;
  v_video_evening uuid;

  -- Audio IDs
  v_audio_clarity uuid;
  v_audio_focused_believing uuid;
  v_audio_morning_mentality uuid;
  v_audio_deep_flow uuid;
  v_audio_executive_grounding uuid;
  v_audio_vip_attention uuid;
  v_audio_vip_confidence uuid;

  -- Spark IDs
  v_spark_clarity uuid;
  v_spark_poise uuid;
  v_spark_dividend uuid;
  v_spark_reset uuid;
  v_spark_intentions uuid;
  v_spark_vip_attention uuid;
  v_spark_vip_confidence uuid;
BEGIN
  -- ============================================================================
  -- 1. VIDEOS SEED
  -- ============================================================================
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
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_video_clarity FROM public.videos WHERE title = 'The Architecture of Quiet Clarity' LIMIT 1;

  INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status)
  VALUES (
    'Focus Reset',
    'Single-task immersion and rapid autonomic nervous system recalibration.',
    '/assets/videos/focus-reset.mp4',
    '/assets/images/spark-focus-dividend.jpg',
    '1:05',
    65,
    'Focus',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_video_focus FROM public.videos WHERE title = 'Focus Reset' LIMIT 1;

  INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status)
  VALUES (
    'Confidence Practice',
    'Cultivating emotional poise and grounded presence under pressure.',
    '/assets/videos/confidence-practice.mp4',
    '/assets/images/spark-leading-poise.jpg',
    '0:48',
    48,
    'Confidence',
    true,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_video_confidence FROM public.videos WHERE title = 'Confidence Practice' LIMIT 1;

  INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status)
  VALUES (
    'Evening Reflection',
    'Decompressing cognitive load and setting sovereign boundaries between effort and rest.',
    '/assets/videos/evening-reflection.mp4',
    '/assets/images/spark-aligning-intentions.jpg',
    '1:20',
    80,
    'Reflection',
    true,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_video_evening FROM public.videos WHERE title = 'Evening Reflection' LIMIT 1;

  -- ============================================================================
  -- 2. AUDIOS SEED
  -- ============================================================================
  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Guided Contemplation',
    '432Hz Calm Resonance focused on constructing mental spaciousness.',
    '/assets/audio/guided-contemplation.mp3',
    '4 min',
    255,
    'Mindfulness',
    'Voice of Dr. Cubie',
    '/assets/images/hero-quiet-clarity.jpg',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_clarity FROM public.audios WHERE title = 'Guided Contemplation' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Focused Believing',
    'Deep strategic mindset anchoring for executive leaders.',
    '/assets/audio/focused-believing.mp3',
    '04:15',
    255,
    'Mindfulness',
    'Voice of Dr. Cubie',
    '/assets/images/hero-quiet-clarity.jpg',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_focused_believing FROM public.audios WHERE title = 'Focused Believing' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Morning Mentality',
    'Gentle morning contemplation on intentionality before entering digital noise.',
    '/assets/audio/morning-mentality.mp3',
    '08:30 min',
    510,
    'Mindfulness',
    'Voice of Dr. Cubie',
    '/assets/images/hero-quiet-clarity.jpg',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_morning_mentality FROM public.audios WHERE title = 'Morning Mentality' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Deep Flow State',
    'Binaural soundscape and guided focus recalibration for single-task immersion.',
    '/assets/audio/deep-flow-state.mp3',
    '05:20 min',
    320,
    'Focus',
    'Voice of Dr. Cubie',
    '/assets/images/spark-focus-dividend.jpg',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_deep_flow FROM public.audios WHERE title = 'Deep Flow State' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Executive Grounding',
    'Steering turbulence into purposeful composure under high friction.',
    '/assets/audio/executive-grounding.mp3',
    '3 min',
    180,
    'Leadership',
    'Voice of Dr. Cubie',
    '/assets/images/spark-leading-poise.jpg',
    false,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_executive_grounding FROM public.audios WHERE title = 'Executive Grounding' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'The Power of Attention (VIP Extended)',
    'Extended 12-Minute Deep Immersion on sovereign focus control.',
    '/assets/audio/power-of-attention.mp3',
    '12 min',
    720,
    'Focus',
    'Voice of Dr. Cubie',
    '/assets/images/vip-pass-card.jpg',
    true,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_vip_attention FROM public.audios WHERE title = 'The Power of Attention (VIP Extended)' LIMIT 1;

  INSERT INTO public.audios (title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status)
  VALUES (
    'Quiet Confidence (VIP Extended)',
    'Transcending the need for external validation in complex environments.',
    '/assets/audio/quiet-confidence.mp3',
    '8 min',
    480,
    'Mindset',
    'Voice of Dr. Cubie',
    '/assets/images/vip-pass-card.jpg',
    true,
    'published'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_audio_vip_confidence FROM public.audios WHERE title = 'Quiet Confidence (VIP Extended)' LIMIT 1;

  -- ============================================================================
  -- 3. SPARKS SEED
  -- ============================================================================
  -- Spark 1: The Architecture of Quiet Clarity
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'the-architecture-of-quiet-clarity',
    'The Architecture of Quiet Clarity',
    'Why intentional stillness builds resilient decisions in demanding environments.',
    'Mindfulness',
    '4 min',
    '/assets/images/hero-quiet-clarity.jpg',
    v_video_clarity,
    v_audio_clarity,
    'Cognitive overload blurs the boundary between urgency and genuine importance.',
    'Stillness protects cognitive energy before high-stakes choices.',
    'Take three uninterrupted breaths before opening your morning communications.',
    false,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET video_id = EXCLUDED.video_id, audio_id = EXCLUDED.audio_id, status = 'published';

  SELECT id INTO v_spark_clarity FROM public.sparks WHERE slug = 'the-architecture-of-quiet-clarity' LIMIT 1;

  -- Spark 2: Leading With Poise
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'leading-with-poise',
    'Leading With Poise',
    'Steering turbulence into purposeful composure.',
    'Leadership',
    '3 min',
    '/assets/images/spark-leading-poise.jpg',
    v_video_confidence,
    v_audio_executive_grounding,
    'The nervous system of an organization mirrors the emotional posture of its leaders.',
    'Composure in crisis creates safety for collective intelligence to emerge.',
    'Pause for 5 seconds before responding to any high-friction email today.',
    false,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET video_id = EXCLUDED.video_id, audio_id = EXCLUDED.audio_id, status = 'published';

  SELECT id INTO v_spark_poise FROM public.sparks WHERE slug = 'leading-with-poise' LIMIT 1;

  -- Spark 3: The Focus Dividend
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'the-focus-dividend',
    'The Focus Dividend',
    'The compounding value of single-task immersion.',
    'Focus',
    '4 min',
    '/assets/images/spark-focus-dividend.jpg',
    v_video_focus,
    v_audio_deep_flow,
    'Every context switch incurs an attention residue that degrades working memory.',
    'Mono-tasking produces a qualitative depth that multitasking can never replicate.',
    'Work on one single document or task for 30 minutes with notifications muted.',
    false,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET video_id = EXCLUDED.video_id, audio_id = EXCLUDED.audio_id, status = 'published';

  SELECT id INTO v_spark_dividend FROM public.sparks WHERE slug = 'the-focus-dividend' LIMIT 1;

  -- Spark 4: Reset Your Perspective
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'reset-your-perspective',
    'Reset Your Perspective',
    'Rapid autonomic nervous system recalibration for clear focus.',
    'Mindset',
    '1 min',
    '/assets/images/spark-video-reset.jpg',
    v_video_focus,
    v_audio_clarity,
    'Optical stillness triggers physiological calming. By softening focal gaze, you quiet the amygdala.',
    'When cognitive velocity spirals, physiology provides the fastest lever for recovery.',
    'Inhale for 4 seconds, hold for 2, exhale slowly for 6 seconds.',
    false,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET video_id = EXCLUDED.video_id, audio_id = EXCLUDED.audio_id, status = 'published';

  SELECT id INTO v_spark_reset FROM public.sparks WHERE slug = 'reset-your-perspective' LIMIT 1;

  -- Spark 5: Aligning Intentions
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'aligning-intentions',
    'Aligning Intentions',
    'Harmonizing personal values with professional drive.',
    'Purpose',
    '4 min',
    '/assets/images/spark-aligning-intentions.jpg',
    v_video_evening,
    v_audio_clarity,
    'Alignment is an ongoing recalibration, not a one-time decision.',
    'Inner friction drops dramatically when our daily labor serves authentic values.',
    'Reflect on whether your top priority this week aligns with your long-term vision.',
    false,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET video_id = EXCLUDED.video_id, audio_id = EXCLUDED.audio_id, status = 'published';

  SELECT id INTO v_spark_intentions FROM public.sparks WHERE slug = 'aligning-intentions' LIMIT 1;

  -- Spark 6 (VIP): The Power of Attention
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'the-power-of-attention',
    'The Power of Attention',
    'Extended 12-Minute Deep Immersion on attention sovereignty.',
    'Focus',
    '12 min',
    '/assets/images/vip-pass-card.jpg',
    v_video_focus,
    v_audio_vip_attention,
    'Your attention is your life. What you attend to becomes your consciousness.',
    'Executive presence is the deliberate allocation of sovereign attention.',
    'Dedicate the first hour of your workday entirely off-grid.',
    true,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET is_vip = true, status = 'published';

  SELECT id INTO v_spark_vip_attention FROM public.sparks WHERE slug = 'the-power-of-attention' LIMIT 1;

  -- Spark 7 (VIP): Quiet Confidence
  INSERT INTO public.sparks (
    slug, title, short_description, category, duration, thumbnail_url,
    video_id, audio_id, reflection, insight, practice, is_vip, status
  )
  VALUES (
    'quiet-confidence',
    'Quiet Confidence',
    'Transcending the Need for External Validation.',
    'Mindset',
    '8 min',
    '/assets/images/vip-pass-card.jpg',
    v_video_confidence,
    v_audio_vip_confidence,
    'Validation sought from external metrics always creates internal fragility.',
    'Grounded stillness speaks louder than performed certainty.',
    'Acknowledge your own effort privately before seeking feedback.',
    true,
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
  SET is_vip = true, status = 'published';

  SELECT id INTO v_spark_vip_confidence FROM public.sparks WHERE slug = 'quiet-confidence' LIMIT 1;

  -- ============================================================================
  -- 4. DAILY CONTENT SEED
  -- ============================================================================
  IF v_spark_clarity IS NOT NULL THEN
    INSERT INTO public.daily_content (content_date, spark_id, status)
    VALUES (CURRENT_DATE, v_spark_clarity, 'published')
    ON CONFLICT (content_date) DO UPDATE
    SET spark_id = EXCLUDED.spark_id, status = 'published';
  END IF;

  -- ============================================================================
  -- 5. RECOMMENDATIONS SEED
  -- ============================================================================
  DELETE FROM public.recommendations WHERE created_by IS NULL;

  IF v_spark_clarity IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('The Architecture of Quiet Clarity', 'spark', v_spark_clarity, 'Mindfulness', 1, true);
  END IF;

  IF v_spark_poise IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('Leading With Poise', 'spark', v_spark_poise, 'Leadership', 2, true);
  END IF;

  IF v_spark_dividend IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('The Focus Dividend', 'spark', v_spark_dividend, 'Focus', 3, true);
  END IF;

  IF v_spark_reset IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('Reset Your Perspective', 'spark', v_spark_reset, 'Mindset', 4, true);
  END IF;

  IF v_spark_intentions IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('Aligning Intentions', 'spark', v_spark_intentions, 'Purpose', 5, true);
  END IF;

  IF v_video_focus IS NOT NULL THEN
    INSERT INTO public.recommendations (title, content_type, content_id, category, display_order, is_active)
    VALUES ('Focus Reset (Guided Video)', 'video', v_video_focus, 'Focus', 6, true);
  END IF;

END $$;
