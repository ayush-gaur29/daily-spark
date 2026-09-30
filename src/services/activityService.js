import { supabase } from '../lib/supabase.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a standard UUID.
 */
export const isValidUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Fetch user content activity records.
 * RLS enforces auth.uid() = user_id.
 */
export const fetchUserActivity = async (userId) => {
  if (!supabase || !userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('content_activity')
      .select('id, user_id, content_type, content_id, progress, completed, last_played_at, updated_at')
      .eq('user_id', userId)
      .order('last_played_at', { ascending: false });

    if (error) {
      console.warn('[ActivityService] fetchUserActivity error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[ActivityService] fetchUserActivity exception:', err);
    return [];
  }
};

/**
 * Fetch the user's most recent video activity (in-progress or latest watched).
 */
export const fetchLatestVideoActivity = async (userId) => {
  if (!supabase || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('content_activity')
      .select('id, user_id, content_type, content_id, progress, completed, last_played_at')
      .eq('user_id', userId)
      .eq('content_type', 'video')
      .order('last_played_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[ActivityService] fetchLatestVideoActivity error:', error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('[ActivityService] fetchLatestVideoActivity exception:', err);
    return null;
  }
};

/**
 * Record or update user progress on a spark, video, or audio track.
 * Conflict-safe upsert on (user_id, content_type, content_id).
 */
export const recordContentActivity = async ({
  userId,
  contentType = 'spark',
  contentId,
  progress = 0,
  completed = false
}) => {
  if (!supabase || !userId || !contentId) {
    return null;
  }

  try {
    let resolvedContentId = contentId;

    // If contentId is not a valid UUID (e.g. spark slug), look up the spark UUID
    if (!isValidUuid(resolvedContentId) && contentType === 'spark') {
      const { data: sparkData } = await supabase
        .from('sparks')
        .select('id')
        .eq('slug', resolvedContentId)
        .maybeSingle();

      if (sparkData?.id) {
        resolvedContentId = sparkData.id;
      }
    }

    // If still not a valid UUID, abort to prevent PostgreSQL query error
    if (!isValidUuid(resolvedContentId)) {
      console.warn('[ActivityService] Invalid UUID for content_id:', contentId);
      return null;
    }

    const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
    const isCompleted = Boolean(completed || clampedProgress >= 98);

    const { data, error } = await supabase
      .from('content_activity')
      .upsert(
        {
          user_id: userId,
          content_type: contentType,
          content_id: resolvedContentId,
          progress: clampedProgress,
          completed: isCompleted,
          last_played_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,content_type,content_id'
        }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[ActivityService] recordContentActivity error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[ActivityService] recordContentActivity exception:', err);
    return null;
  }
};

/**
 * Calculates current active streak in days from activity records.
 * Streak counts consecutive days ending today or yesterday.
 */
export const calculateStreakFromActivities = (activities = []) => {
  if (!activities || activities.length === 0) return 0;

  const dateSet = new Set();
  activities.forEach((act) => {
    const ts = act.last_played_at || act.updated_at || act.created_at;
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateSet.add(`${y}-${m}-${day}`);
      }
    }
  });

  if (dateSet.size === 0) return 0;

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const now = new Date();
  const todayStr = formatDate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let checkDate = null;
  if (dateSet.has(todayStr)) {
    checkDate = new Date(now);
  } else if (dateSet.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (checkDate) {
    const str = formatDate(checkDate);
    if (dateSet.has(str)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calculates total sparks completed by user.
 */
export const calculateSparksDone = (activities = []) => {
  if (!activities || activities.length === 0) return 0;
  const completedSparks = new Set();
  activities.forEach((act) => {
    if (act.content_type === 'spark' && (act.completed || Number(act.progress) >= 80)) {
      completedSparks.add(act.content_id);
    }
  });
  return completedSparks.size;
};

/**
 * Calculates mindful audio listening hours from actual audio activity records.
 */
export const calculateMindfulAudioHours = (activities = [], audioDurationsMap = new Map()) => {
  if (!activities || activities.length === 0) return '0.0h';
  let totalAudioSeconds = 0;
  activities.forEach((act) => {
    if (act.content_type === 'audio') {
      const dur = audioDurationsMap.get(act.content_id) || 180;
      const progress = Math.min(100, Math.max(0, Number(act.progress) || (act.completed ? 100 : 0)));
      totalAudioSeconds += Math.round((progress / 100) * dur);
    }
  });
  const hours = totalAudioSeconds / 3600;
  return `${hours.toFixed(1)}h`;
};

/**
 * Fetches dynamic user statistics from actual Supabase content_activity records.
 * Returns { streakDays, sparksDone, mindfulAudioHours }.
 */
export const fetchUserActivityStats = async (userId) => {
  if (!userId) {
    return {
      streakDays: 0,
      sparksDone: 0,
      mindfulAudioHours: '0.0h'
    };
  }

  try {
    const activities = await fetchUserActivity(userId);

    const audioDurationsMap = new Map();
    if (supabase) {
      try {
        const { data: audios } = await supabase
          .from('audios')
          .select('id, duration_seconds');
        if (audios) {
          audios.forEach((a) => {
            if (a.id && a.duration_seconds) {
              audioDurationsMap.set(a.id, a.duration_seconds);
            }
          });
        }
      } catch (err) {
        console.warn('[ActivityService] fetch audio durations note:', err);
      }
    }

    const streakDays = calculateStreakFromActivities(activities);
    const sparksDone = calculateSparksDone(activities);
    const mindfulAudioHours = calculateMindfulAudioHours(activities, audioDurationsMap);

    return {
      streakDays,
      sparksDone,
      mindfulAudioHours
    };
  } catch (err) {
    console.error('[ActivityService] fetchUserActivityStats error:', err);
    return {
      streakDays: 0,
      sparksDone: 0,
      mindfulAudioHours: '0.0h'
    };
  }
};
