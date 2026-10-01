import { supabase } from '../lib/supabase.js';

export const DEFAULT_USER_PREFERENCES = {
  dailyDeliveryTime: '07:00 AM',
  deliveryTimeLabel: 'Morning quiet window',
  audioSpeed: '1.0x',
  speedLabel: 'Reflective pacing',
  preferredTopics: []
};

/**
 * Parses a delivery time string (e.g. "07:00 AM", "8:30 AM", "6:00 PM")
 * into minutes from midnight (0 - 1439).
 */
export const parseDeliveryTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 420; // 7:00 AM default
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 420;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = (match[3] || 'AM').toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
};

/**
 * Generates an evocative, serene label describing the delivery window.
 */
export const getDeliveryTimeLabel = (timeStr) => {
  if (!timeStr) return 'Morning quiet window';
  const minutes = parseDeliveryTimeToMinutes(timeStr);
  if (minutes < 360) return 'Dawn reflection window';
  if (minutes < 450) return 'Morning quiet window'; // 6:00 AM - 7:30 AM
  if (minutes < 540) return 'Morning focus window'; // 7:30 AM - 9:00 AM
  if (minutes < 720) return 'Mid-morning pause window'; // 9:00 AM - 12:00 PM
  if (minutes < 1020) return 'Afternoon reset window'; // 12:00 PM - 5:00 PM
  if (minutes < 1260) return 'Evening wind-down window'; // 5:00 PM - 9:00 PM
  return 'Night quiet window';
};

/**
 * Evaluates whether today's Daily Spark has arrived based on the user's specific delivery time.
 */
export const isSparkDeliveredForUser = (deliveryTimeStr = '07:00 AM') => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = parseDeliveryTimeToMinutes(deliveryTimeStr);
  return currentMinutes >= targetMinutes;
};

/**
 * Generates label for playback speed.
 */
export const getSpeedLabel = (speedVal) => {
  const s = String(speedVal || '1.0x');
  if (s.startsWith('1.0') || s === '1x') return 'Reflective pacing';
  if (s.startsWith('1.25')) return 'Balanced absorption';
  if (s.startsWith('1.5')) return 'Focused cadence';
  return 'Personal pacing';
};

/**
 * Normalizes preferred topics to an array of strings.
 */
export const normalizeTopics = (topics) => {
  if (Array.isArray(topics)) return topics.filter(Boolean);
  if (typeof topics === 'string') {
    return topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Retrieve user preferences from local cache or Supabase Auth metadata.
 */
export const getUserPreferences = (userId, userMetadata = null) => {
  const storageKey = userId ? `drcubie_prefs_${userId}` : 'drcubie_prefs_guest';
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_USER_PREFERENCES,
        ...parsed,
        preferredTopics: normalizeTopics(parsed.preferredTopics)
      };
    }
  } catch (e) {
    console.warn('[UserPreferences] Local storage read error:', e);
  }

  if (userMetadata?.preferences) {
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...userMetadata.preferences,
      preferredTopics: normalizeTopics(userMetadata.preferences.preferredTopics)
    };
  }

  return { ...DEFAULT_USER_PREFERENCES };
};

/**
 * Persists user preferences to Supabase Auth metadata and localStorage.
 */
export const saveUserPreferences = async (userId, partialPrefs) => {
  const storageKey = userId ? `drcubie_prefs_${userId}` : 'drcubie_prefs_guest';
  const current = getUserPreferences(userId);

  const updated = {
    ...current,
    ...partialPrefs
  };

  if (partialPrefs.dailyDeliveryTime && !partialPrefs.deliveryTimeLabel) {
    updated.deliveryTimeLabel = getDeliveryTimeLabel(partialPrefs.dailyDeliveryTime);
  }

  if (partialPrefs.audioSpeed && !partialPrefs.speedLabel) {
    updated.speedLabel = getSpeedLabel(partialPrefs.audioSpeed);
  }

  if (partialPrefs.preferredTopics !== undefined) {
    updated.preferredTopics = normalizeTopics(partialPrefs.preferredTopics);
  }

  // Save to local cache immediately
  try {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (e) {
    console.warn('[UserPreferences] Local storage write error:', e);
  }

  // Dispatches event so all mounted components can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('drcubie_preferences_updated', {
        detail: { userId, preferences: updated }
      })
    );
  }

  // Persist to Supabase Auth metadata if authenticated
  if (supabase && userId) {
    try {
      await supabase.auth.updateUser({
        data: {
          preferences: updated
        }
      });
    } catch (err) {
      console.warn('[UserPreferences] Supabase updateUser preferences error:', err);
    }
  }

  return updated;
};

/**
 * Dynamically queries available topic categories exclusively from Supabase tables (sparks, audios, videos, recommendations).
 * Returns only the dynamic categories that actually exist in the database without any hardcoded, static, or mock data.
 */
export const fetchAvailableTopics = async () => {
  if (!supabase) {
    return [];
  }

  try {
    const [sparksRes, audiosRes, videosRes, recsRes] = await Promise.all([
      supabase.from('sparks').select('category'),
      supabase.from('audios').select('category'),
      supabase.from('videos').select('category'),
      supabase.from('recommendations').select('category')
    ]);

    const topicsSet = new Set();

    (sparksRes.data || []).forEach((item) => {
      const cat = item.category?.trim();
      if (cat) topicsSet.add(cat);
    });
    (audiosRes.data || []).forEach((item) => {
      const cat = item.category?.trim();
      if (cat) topicsSet.add(cat);
    });
    (videosRes.data || []).forEach((item) => {
      const cat = item.category?.trim();
      if (cat) topicsSet.add(cat);
    });
    (recsRes.data || []).forEach((item) => {
      const cat = item.category?.trim();
      if (cat) topicsSet.add(cat);
    });

    return Array.from(topicsSet).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.warn('[UserPreferences] fetchAvailableTopics error:', err);
    return [];
  }
};
