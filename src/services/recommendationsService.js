import { supabase } from '../lib/supabase.js';
import { ALL_RECOMMENDATIONS } from '../data/recommendations.js';

export const INITIAL_RECOMMENDATIONS = ALL_RECOMMENDATIONS;

/**
 * Fetch active recommendations from Supabase, dynamically resolving linked content details.
 */
export const fetchRecommendations = async () => {
  if (!supabase) {
    return ALL_RECOMMENDATIONS;
  }

  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('id, title, content_type, content_id, category, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('[RecommendationsService] fetchRecommendations note:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Collect IDs to resolve linked details in parallel
    const sparkIds = data.filter((r) => r.content_type === 'spark').map((r) => r.content_id);
    const videoIds = data.filter((r) => r.content_type === 'video').map((r) => r.content_id);
    const audioIds = data.filter((r) => r.content_type === 'audio').map((r) => r.content_id);

    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      sparkIds.length > 0
        ? supabase.from('sparks').select('id, slug, title, short_description, category, duration, thumbnail_url').in('id', sparkIds)
        : Promise.resolve({ data: [] }),
      videoIds.length > 0
        ? supabase.from('videos').select('id, title, description, category, duration, duration_seconds, thumbnail_url, video_url').in('id', videoIds)
        : Promise.resolve({ data: [] }),
      audioIds.length > 0
        ? supabase.from('audios').select('id, title, description, category, duration, duration_seconds, speaker, thumbnail_url, audio_url').in('id', audioIds)
        : Promise.resolve({ data: [] })
    ]);

    const sparksMap = new Map((sparksRes.data || []).map((s) => [s.id, s]));
    const videosMap = new Map((videosRes.data || []).map((v) => [v.id, v]));
    const audiosMap = new Map((audiosRes.data || []).map((a) => [a.id, a]));

    const normalized = data.map((rec) => {
      const type = (rec.content_type || 'spark').toLowerCase();
      let linkedMedia = null;
      if (type === 'spark') linkedMedia = sparksMap.get(rec.content_id);
      else if (type === 'video') linkedMedia = videosMap.get(rec.content_id);
      else if (type === 'audio') linkedMedia = audiosMap.get(rec.content_id);

      const title = rec.title || linkedMedia?.title || 'Curated Contemplation';
      const category = rec.category || linkedMedia?.category || 'Mindfulness';
      const duration = linkedMedia?.duration || (type === 'video' ? '0:30' : type === 'audio' ? '3 min' : '4 min');
      const posterUrl = linkedMedia?.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg';
      const videoUrl = linkedMedia?.video_url || '';
      const audioUrl = linkedMedia?.audio_url || '';

      return {
        id: rec.id,
        title,
        description: linkedMedia?.description || linkedMedia?.short_description || 'Curated reflection and wisdom practice tailored for your daily pause.',
        contentType: type,
        contentId: rec.content_id,
        sparkId: type === 'spark' ? (linkedMedia?.slug || rec.content_id) : rec.content_id,
        category,
        duration,
        actionText: type === 'video' ? 'Watch →' : type === 'audio' ? 'Listen →' : 'Explore →',
        actionType: type,
        videoUrl,
        audioUrl,
        posterUrl,
        coverUrl: posterUrl,
        displayOrder: rec.display_order ?? 1
      };
    });

    return normalized;
  } catch (err) {
    console.error('[RecommendationsService] fetchRecommendations exception:', err);
    return [];
  }
};

