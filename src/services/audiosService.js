import { supabase } from '../lib/supabase.js';
import { ALL_AUDIOS, WAVEFORM_PRESETS } from '../data/audios.js';

// Waveform patterns matching the serene soundscape designs
const WAVEFORM_PATTERNS = [
  WAVEFORM_PRESETS.calm,
  WAVEFORM_PRESETS.guided,
  WAVEFORM_PRESETS.focus,
  WAVEFORM_PRESETS.reset
];

export const INITIAL_AUDIO_TRACKS = ALL_AUDIOS;

export const normalizeAudio = (dbAudio, index = 0) => {
  if (!dbAudio) return null;

  const durationSec = dbAudio.duration_seconds || 180;
  const durationLabel = dbAudio.duration || '03:00';
  const speakerName = dbAudio.speaker ? dbAudio.speaker.trim() : 'Voice of Dr. Cubie';

  return {
    id: dbAudio.id,
    title: dbAudio.title || 'Untitled Audio Session',
    subtitle: dbAudio.description || '',
    description: dbAudio.description || '',
    author: `${speakerName} • ${dbAudio.category || 'Session'}`,
    speaker: speakerName,
    category: dbAudio.category || 'Mindfulness',
    categoryTag: `${durationLabel} • ${(dbAudio.category || 'AUDIO').toUpperCase()}`,
    durationTotal: durationSec,
    durationText: durationLabel,
    currentSeconds: 0,
    audioUrl: dbAudio.audio_url || '',
    coverUrl: dbAudio.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
    sparkId: dbAudio.spark_id || null,
    waveformPattern: WAVEFORM_PATTERNS[index % WAVEFORM_PATTERNS.length],
    isVip: Boolean(dbAudio.is_vip),
    is_vip: Boolean(dbAudio.is_vip),
    status: dbAudio.status || 'published'
  };
};

/**
 * Fetch published audios from Supabase.
 */
export const fetchAudios = async ({ isVip = null } = {}) => {
  if (!supabase) {
    return ALL_AUDIOS;
  }

  try {
    let query = supabase
      .from('audios')
      .select('id, title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (typeof isVip === 'boolean') {
      query = query.eq('is_vip', isVip);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[AudiosService] fetchAudios note:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item, idx) => normalizeAudio(item, idx));
  } catch (err) {
    console.error('[AudiosService] fetchAudios exception:', err);
    return [];
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch a single audio track by ID.
 */
export const fetchAudioById = async (id) => {
  if (!id) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return normalizeAudio(data);
      }

      // Fallback: If id matches a spark ID or spark slug with an attached audio
      const isUuid = UUID_REGEX.test(id);
      let sparkQuery = supabase
        .from('sparks')
        .select('*, audios(*)');

      if (isUuid) {
        sparkQuery = sparkQuery.eq('id', id);
      } else {
        sparkQuery = sparkQuery.eq('slug', id);
      }

      const { data: sparkData } = await sparkQuery.maybeSingle();
      if (sparkData?.audios) {
        return normalizeAudio({
          ...sparkData.audios,
          spark_id: sparkData.id
        });
      }
    } catch (err) {
      console.warn('[AudiosService] fetchAudioById exception:', err);
    }
  }

  const fallback = ALL_AUDIOS.find((a) => a.id === id || a.slug === id);
  return fallback || null;
};

