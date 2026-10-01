import { supabase } from '../lib/supabase.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Resolves a contentId to a valid UUID if a slug was passed for a spark.
 */
const resolveUuid = async (contentType, contentId) => {
  if (isValidUuid(contentId)) return contentId;

  if (supabase && (contentType === 'spark' || !contentType)) {
    try {
      const { data } = await supabase
        .from('sparks')
        .select('id')
        .eq('slug', contentId)
        .maybeSingle();

      if (data?.id) return data.id;
    } catch {
      // ignore
    }
  }

  return null;
};

/**
 * Fetch all saved content records for the authenticated user.
 * RLS enforces auth.uid() = user_id.
 */
export const fetchUserSavedContent = async (userId) => {
  if (!supabase || !userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('saved_content')
      .select('id, user_id, content_type, content_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[SavedContentService] fetchUserSavedContent error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[SavedContentService] fetchUserSavedContent exception:', err);
    return [];
  }
};

/**
 * Fetch all saved items for the user with full resolved details (title, cover, category, etc.)
 * across Sparks, Videos, and Audios.
 */
export const fetchUserSavedItemsDetailed = async (userId) => {
  if (!supabase || !userId) {
    return [];
  }

  try {
    const savedRecords = await fetchUserSavedContent(userId);
    if (!savedRecords || savedRecords.length === 0) {
      return [];
    }

    const sparkIds = savedRecords.filter((r) => r.content_type === 'spark').map((r) => r.content_id);
    const videoIds = savedRecords.filter((r) => r.content_type === 'video').map((r) => r.content_id);
    const audioIds = savedRecords.filter((r) => r.content_type === 'audio').map((r) => r.content_id);

    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      sparkIds.length > 0
        ? supabase.from('sparks').select('id, slug, title, short_description, category, duration, thumbnail_url, reflection, created_at, videos(*), audios(*)').in('id', sparkIds)
        : Promise.resolve({ data: [] }),
      videoIds.length > 0
        ? supabase.from('videos').select('id, title, description, category, duration, duration_seconds, thumbnail_url, video_url, is_vip, status, created_at').in('id', videoIds)
        : Promise.resolve({ data: [] }),
      audioIds.length > 0
        ? supabase.from('audios').select('id, title, description, category, duration, duration_seconds, speaker, thumbnail_url, audio_url, is_vip, status, created_at').in('id', audioIds)
        : Promise.resolve({ data: [] })
    ]);

    const sparksMap = new Map((sparksRes.data || []).map((s) => [s.id, s]));
    const videosMap = new Map((videosRes.data || []).map((v) => [v.id, v]));
    const audiosMap = new Map((audiosRes.data || []).map((a) => [a.id, a]));

    const detailedItems = [];

    for (const record of savedRecords) {
      const { id: savedRecordId, content_type, content_id, created_at } = record;

      if (content_type === 'spark') {
        const item = sparksMap.get(content_id);
        if (item) {
          detailedItems.push({
            savedRecordId,
            id: item.slug || item.id,
            dbId: item.id,
            slug: item.slug || '',
            videoId: item.videos?.id || item.video_id || null,
            audioId: item.audios?.id || item.audio_id || null,
            isVip: Boolean(item.is_vip),
            is_vip: Boolean(item.is_vip),
            contentType: 'spark',
            title: item.title,
            subtitle: item.short_description || item.reflection || 'Reflection and contemplation',
            category: (item.category || 'Mindfulness').toLowerCase(),
            categoryLabel: item.category || 'Mindfulness',
            duration: item.duration || '4 min',
            date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(created_at)),
            imageUrl: item.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
            icon: item.videos ? 'play_circle' : 'nature_people',
            type: item.videos ? 'video' : 'audio',
            saved: true,
            audioUrl: item.audios?.audio_url || '',
            videoUrl: item.videos?.video_url || '',
            raw: item
          });
        }
      } else if (content_type === 'video') {
        const item = videosMap.get(content_id);
        if (item) {
          detailedItems.push({
            savedRecordId,
            id: item.id,
            dbId: item.id,
            contentType: 'video',
            title: item.title,
            subtitle: item.description || 'Video practice session',
            category: (item.category || 'Video').toLowerCase(),
            categoryLabel: item.category || 'Video',
            duration: item.duration || '0:30',
            durationSeconds: item.duration_seconds || 30,
            date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(created_at)),
            imageUrl: item.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
            icon: 'smart_display',
            type: 'video',
            saved: true,
            videoUrl: item.video_url || '',
            raw: item
          });
        }
      } else if (content_type === 'audio') {
        const item = audiosMap.get(content_id);
        if (item) {
          detailedItems.push({
            savedRecordId,
            id: item.id,
            dbId: item.id,
            contentType: 'audio',
            title: item.title,
            subtitle: item.description || item.speaker || 'Audio contemplative session',
            category: (item.category || 'Audio').toLowerCase(),
            categoryLabel: item.category || 'Audio',
            duration: item.duration || '3 min',
            durationTotal: item.duration_seconds || 180,
            date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(created_at)),
            imageUrl: item.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
            icon: 'headphones',
            type: 'audio',
            saved: true,
            audioUrl: item.audio_url || '',
            raw: item
          });
        }
      }
    }

    return detailedItems;
  } catch (err) {
    console.error('[SavedContentService] fetchUserSavedItemsDetailed exception:', err);
    return [];
  }
};

/**
 * Save a content item to personal archive.
 */
export const saveUserContent = async (userId, contentType, contentId) => {
  if (!supabase || !userId || !contentId) {
    return { success: false, error: 'User or content ID missing' };
  }

  try {
    const finalContentId = await resolveUuid(contentType, contentId);
    if (!finalContentId) {
      console.warn('[SavedContentService] Could not resolve UUID for contentId:', contentId);
      return { success: false, error: 'Invalid content ID' };
    }

    const { data, error } = await supabase
      .from('saved_content')
      .insert({
        user_id: userId,
        content_type: contentType || 'spark',
        content_id: finalContentId
      })
      .select()
      .maybeSingle();

    if (error) {
      // If unique violation, it's already saved
      if (error.code === '23505') {
        return { success: true, alreadySaved: true };
      }
      console.warn('[SavedContentService] saveUserContent error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[SavedContentService] saveUserContent exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Remove a content item from personal archive.
 */
export const removeUserSavedContent = async (userId, contentType, contentId) => {
  if (!supabase || !userId || !contentId) {
    return { success: false };
  }

  try {
    const finalContentId = await resolveUuid(contentType, contentId);
    if (!finalContentId) {
      return { success: false };
    }

    const { error } = await supabase
      .from('saved_content')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', contentType || 'spark')
      .eq('content_id', finalContentId);

    if (error) {
      console.warn('[SavedContentService] removeUserSavedContent error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[SavedContentService] removeUserSavedContent exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle saved status for a user item.
 */
export const toggleUserSavedContent = async (userId, contentType, contentId, currentlySaved) => {
  if (currentlySaved) {
    const res = await removeUserSavedContent(userId, contentType, contentId);
    return { saved: !res.success, toggled: res.success };
  } else {
    const res = await saveUserContent(userId, contentType, contentId);
    return { saved: res.success, toggled: res.success };
  }
};
