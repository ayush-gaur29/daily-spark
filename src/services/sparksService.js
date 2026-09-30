import { supabase } from '../lib/supabase.js';
import { INITIAL_SPARKS } from '../data/sparks.js';

/**
 * Normalizes a database row from 'sparks' (with optional joined videos & audios)
 * into the shape expected across the UI (cards, detail reader, audio player).
 */
export const normalizeSpark = (dbSpark, fallback = null) => {
  if (!dbSpark) return fallback;

  const video = dbSpark.videos || null;
  const audio = dbSpark.audios || null;

  // Split practice string into actionable bullet steps if not already an array
  let practiceSteps = [];
  if (dbSpark.practice) {
    practiceSteps = dbSpark.practice
      .split(/(?:\r\n|\r|\n|\. )+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }
  if (practiceSteps.length === 0) {
    practiceSteps = [
      'Close or tilt away your digital screen completely.',
      'Write down on physical paper your single essential priority.',
      'Inhale deeply for four seconds, exhale, and quietly begin.'
    ];
  }

  const slug = dbSpark.slug || dbSpark.id;

  return {
    id: slug,
    db_id: dbSpark.id,
    slug: dbSpark.slug || '',
    title: dbSpark.title || 'Untitled Spark',
    subtitle: dbSpark.short_description || dbSpark.reflection || '',
    short_description: dbSpark.short_description || '',
    category: (dbSpark.category || 'Mindfulness').toLowerCase(),
    categoryLabel: dbSpark.category || 'Mindfulness',
    duration: dbSpark.duration || '4 min',
    audioDuration: audio?.duration_seconds || 255,
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
      new Date(dbSpark.created_at || Date.now())
    ),
    saved: false, // populated dynamically per authenticated user
    type: video ? 'video' : 'audio',
    isVideo: Boolean(video),
    icon: video ? 'play_circle' : 'nature_people',
    quote: dbSpark.reflection || 'Clarity is not found in doing more, but in stripping away the non-essential.',
    quoteAttribution: '— Dr. Cubie • Sanctuary Wisdom',
    narrator: audio?.speaker || 'Voice of Dr. Cubie',
    audioTitle: audio?.title || 'Guided Contemplation',
    audioSubtitle: audio?.description || '432Hz Calm Resonance',
    audioUrl: audio?.audio_url || '',
    shortPreview: dbSpark.short_description || '',
    image: dbSpark.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
    fallbackImage: '/assets/images/hero-quiet-clarity.jpg',
    detailImage: dbSpark.thumbnail_url || '/assets/images/spark-detail-reader.jpg',
    videoUrl: video?.video_url || '',
    videoDuration: video?.duration || '0:30',
    videoPoster: video?.thumbnail_url || dbSpark.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
    video_id: dbSpark.video_id || video?.id || null,
    audio_id: dbSpark.audio_id || audio?.id || null,
    video: video ? {
      id: video.id,
      title: video.title || dbSpark.title,
      description: video.description || dbSpark.short_description,
      videoUrl: video.video_url || '',
      video_url: video.video_url || '',
      posterUrl: video.thumbnail_url || dbSpark.thumbnail_url || '',
      thumbnail_url: video.thumbnail_url || dbSpark.thumbnail_url || '',
      duration: video.duration || '0:30',
      durationSeconds: video.duration_seconds || 30,
      category: video.category || dbSpark.category || 'Mindfulness'
    } : null,
    audio: audio ? {
      id: audio.id,
      title: audio.title || dbSpark.title,
      description: audio.description,
      audioUrl: audio.audio_url || '',
      audio_url: audio.audio_url || '',
      thumbnailUrl: audio.thumbnail_url || dbSpark.thumbnail_url || '',
      duration: audio.duration || '1 min',
      durationSeconds: audio.duration_seconds || 113,
      category: audio.category || dbSpark.category || 'Mindfulness',
      speaker: audio.speaker || 'Voice of Dr. Cubie'
    } : null,
    videos: video,
    audios: audio,
    insight: dbSpark.insight || 'Stillness protects cognitive energy before high-stakes choices.',
    practice: dbSpark.practice || 'Take three uninterrupted breaths before opening your morning communications.',
    introParagraph: dbSpark.short_description || 'True stillness is rarely the absence of noise; rather, it is the deliberate presence of self-governed awareness.',
    principleHeading: 'The Principle',
    principleText: dbSpark.reflection || 'Cognitive overload blurs the boundary between urgency and genuine importance.',
    introspectivePrompt: 'Where in your routine are you substituting sheer activity for meaningful progress?',
    practiceHeading: "Today's 1-Minute Practice",
    practiceSteps,
    is_vip: Boolean(dbSpark.is_vip),
    isVip: Boolean(dbSpark.is_vip),
    status: dbSpark.status || 'published',
    created_at: dbSpark.created_at
  };
};

/**
 * Fetch all published sparks from Supabase.
 * Returns joined video and audio relations.
 */
export const fetchSparks = async () => {
  if (!supabase) {
    return INITIAL_SPARKS;
  }

  try {
    const { data, error } = await supabase
      .from('sparks')
      .select(`
        id,
        slug,
        title,
        short_description,
        category,
        duration,
        thumbnail_url,
        reflection,
        insight,
        practice,
        status,
        is_vip,
        created_at,
        videos (
          id,
          title,
          video_url,
          thumbnail_url,
          duration,
          duration_seconds,
          category,
          is_vip
        ),
        audios (
          id,
          title,
          description,
          audio_url,
          duration,
          duration_seconds,
          speaker,
          is_vip
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[SparksService] fetchSparks database warning:', error.message);
      return INITIAL_SPARKS;
    }

    if (!data || data.length === 0) {
      return INITIAL_SPARKS;
    }

    // Merge database sparks, supplementing any static items not yet in DB
    const dbNormalized = data.map((item) => normalizeSpark(item));
    const dbSlugs = new Set(dbNormalized.map((s) => s.id));

    // Keep static items as fallback for any not yet seeded
    const remainingStatic = INITIAL_SPARKS.filter((s) => !dbSlugs.has(s.id));
    return [...dbNormalized, ...remainingStatic];
  } catch (err) {
    console.error('[SparksService] fetchSparks exception:', err);
    return INITIAL_SPARKS;
  }
};

/**
 * Fetch single spark by slug or UUID.
 */
export const fetchSparkById = async (slugOrId) => {
  if (!slugOrId) return null;

  if (supabase) {
    try {
      // Check if parameter is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
      let query = supabase
        .from('sparks')
        .select(`
          id,
          slug,
          title,
          short_description,
          category,
          duration,
          thumbnail_url,
          reflection,
          insight,
          practice,
          status,
          is_vip,
          created_at,
          videos (*),
          audios (*)
        `)
        .eq('status', 'published');

      if (isUuid) {
        query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
      } else {
        query = query.eq('slug', slugOrId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        return normalizeSpark(data);
      }
    } catch (err) {
      console.warn('[SparksService] fetchSparkById exception:', err);
    }
  }

  // Fallback to static archive
  return INITIAL_SPARKS.find((s) => s.id === slugOrId) || INITIAL_SPARKS[0] || null;
};

// In-flight promise cache to prevent duplicate simultaneous daily_content queries
let inFlightTodayPromise = null;

/**
 * Fetch Today's scheduled Spark from 'daily_content'.
 */
export const fetchTodayContent = async () => {
  if (!supabase) {
    return { todaySpark: INITIAL_SPARKS[0], quote: null, quoteAuthor: 'Dr. Cubie' };
  }

  if (inFlightTodayPromise) {
    return inFlightTodayPromise;
  }

  inFlightTodayPromise = (async () => {
    try {
      const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date()); // YYYY-MM-DD

      // 1. Try exact today date
      let { data, error } = await supabase
        .from('daily_content')
        .select(`
          id,
          content_date,
          status,
          sparks (
            id,
            slug,
            title,
            short_description,
            category,
            duration,
            thumbnail_url,
            reflection,
            insight,
            practice,
            status,
            is_vip,
            created_at,
            videos (*),
            audios (*)
          )
        `)
        .eq('content_date', todayStr)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error('[SparksService] fetchTodayContent query error:', error);
      }

      // 2. If no record for today's exact date, fetch the most recent published daily content
      if (!data && !error) {
        const { data: latestData, error: latestError } = await supabase
          .from('daily_content')
          .select(`
            id,
            content_date,
            status,
            sparks (
              id,
              slug,
              title,
              short_description,
              category,
              duration,
              thumbnail_url,
              reflection,
              insight,
              practice,
              status,
              is_vip,
              created_at,
              videos (*),
              audios (*)
            )
          `)
          .eq('status', 'published')
          .order('content_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          console.error('[SparksService] fetchTodayContent latest query error:', latestError);
        } else {
          data = latestData;
        }
      }

      if (data?.sparks) {
        const sparkRaw = data.sparks;

        // If join didn't populate videos/audios, resolve them individually if IDs exist
        if (sparkRaw.video_id && !sparkRaw.videos) {
          const { data: vRow } = await supabase.from('videos').select('*').eq('id', sparkRaw.video_id).maybeSingle();
          if (vRow) sparkRaw.videos = vRow;
        }
        if (sparkRaw.audio_id && !sparkRaw.audios) {
          const { data: aRow } = await supabase.from('audios').select('*').eq('id', sparkRaw.audio_id).maybeSingle();
          if (aRow) sparkRaw.audios = aRow;
        }

        const normalizedSpark = normalizeSpark(sparkRaw, null);

        const v = sparkRaw.videos;
        const scheduledVideo = v ? {
          id: v.id,
          title: v.title || sparkRaw.title,
          description: v.description || sparkRaw.short_description,
          videoUrl: v.video_url || '',
          video_url: v.video_url || '',
          posterUrl: v.thumbnail_url || sparkRaw.thumbnail_url || '',
          thumbnail_url: v.thumbnail_url || sparkRaw.thumbnail_url || '',
          duration: v.duration || '0:30',
          durationSeconds: v.duration_seconds || 30,
          category: v.category || sparkRaw.category || 'Mindfulness',
          sparkId: sparkRaw.slug || sparkRaw.id,
          sparkDbId: sparkRaw.id
        } : null;

        const a = sparkRaw.audios;
        const scheduledAudio = a ? {
          id: a.id,
          title: a.title || sparkRaw.title,
          description: a.description,
          audioUrl: a.audio_url || '',
          audio_url: a.audio_url || '',
          thumbnailUrl: a.thumbnail_url || sparkRaw.thumbnail_url || '',
          duration: a.duration || '1 min',
          durationSeconds: a.duration_seconds || 113,
          category: a.category || sparkRaw.category || 'Mindfulness',
          speaker: a.speaker || 'Voice of Dr. Cubie',
          sparkId: sparkRaw.slug || sparkRaw.id,
          sparkDbId: sparkRaw.id
        } : null;

        return {
          dailyContentId: data.id,
          contentDate: data.content_date,
          todaySpark: normalizedSpark,
          scheduledVideo,
          scheduledAudio,
          quote: sparkRaw.reflection || null,
          quoteAuthor: 'Dr. Cubie'
        };
      }
    } catch (err) {
      console.error('[SparksService] fetchTodayContent exception:', err);
    } finally {
      // Clear in-flight cache shortly after completion to allow fresh queries on subsequent navigations
      setTimeout(() => {
        inFlightTodayPromise = null;
      }, 500);
    }

    return {
      dailyContentId: null,
      contentDate: new Intl.DateTimeFormat('en-CA').format(new Date()),
      todaySpark: null,
      scheduledVideo: null,
      scheduledAudio: null,
      quote: null,
      quoteAuthor: 'Dr. Cubie'
    };
  })();

  return inFlightTodayPromise;
};
