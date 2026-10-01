import { supabase } from '../lib/supabase.js';
import { TODAY_VIDEOS, VIP_VIDEOS, VIDEOS, ALL_VIDEOS } from '../data/videos.js';

/**
 * Normalizes a database row from 'videos' to the shape expected by UI components.
 */
export const normalizeVideo = (dbVideo, fallback = null) => {
  if (!dbVideo) return fallback;

  return {
    id: dbVideo.id,
    title: dbVideo.title || 'Untitled Video',
    subtitle: dbVideo.description || '',
    description: dbVideo.description || '',
    metadata: `${dbVideo.duration || '0:30'} • ${(dbVideo.category || 'VIDEO').toUpperCase()}`,
    categoryBadge: (dbVideo.category || 'VIDEO').toUpperCase(),
    category: dbVideo.category || 'Mindfulness',
    duration: dbVideo.duration || '0:30',
    durationSeconds: dbVideo.duration_seconds || 30,
    videoUrl: dbVideo.video_url || '',
    posterUrl: dbVideo.thumbnail_url || '',
    isVip: Boolean(dbVideo.is_vip),
    is_vip: Boolean(dbVideo.is_vip),
    status: dbVideo.status || 'published',
    sparkId: dbVideo.spark_id || null
  };
};

/**
 * Fetch published videos from Supabase.
 */
export const fetchVideos = async ({ isVip = null } = {}) => {
  if (!supabase) {
    if (isVip === true) return VIP_VIDEOS;
    return ALL_VIDEOS || TODAY_VIDEOS;
  }

  try {
    let query = supabase
      .from('videos')
      .select('id, title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (typeof isVip === 'boolean') {
      query = query.eq('is_vip', isVip);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[VideosService] fetchVideos note:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => normalizeVideo(item));
  } catch (err) {
    console.error('[VideosService] fetchVideos exception:', err);
    return [];
  }
};


const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch a single video by ID.
 */
export const fetchVideoById = async (id) => {
  if (!id) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return normalizeVideo(data);
      }

      // Fallback: If id matches a spark ID or spark slug with an attached video
      const isUuid = UUID_REGEX.test(id);
      let sparkQuery = supabase
        .from('sparks')
        .select('*, videos(*)');

      if (isUuid) {
        sparkQuery = sparkQuery.eq('id', id);
      } else {
        sparkQuery = sparkQuery.eq('slug', id);
      }

      const { data: sparkData } = await sparkQuery.maybeSingle();
      if (sparkData?.videos) {
        return normalizeVideo({
          ...sparkData.videos,
          spark_id: sparkData.id
        });
      }
    } catch (err) {
      console.warn('[VideosService] fetchVideoById exception:', err);
    }
  }

  return VIDEOS[id] || null;
};
