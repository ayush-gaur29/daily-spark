import { supabase } from '../lib/supabase.js';

/**
 * Resolves media URLs from Supabase Storage buckets or local asset paths.
 * Supports 'videos', 'audio', 'thumbnails', 'avatars' buckets.
 */
export const getStoragePublicUrl = (bucket, path) => {
  if (!supabase || !bucket || !path) return '';
  // If path is already a full URL or local asset path
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || path;
  } catch (err) {
    console.warn(`[MediaService] Error resolving public URL for ${bucket}/${path}:`, err);
    return path;
  }
};

/**
 * Universal media URL resolver.
 * Handles storage relative paths, external CDN links, and local verified fallbacks.
 */
export const resolveMediaUrl = (url, bucket = 'thumbnails', fallback = '') => {
  if (!url) return fallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  return getStoragePublicUrl(bucket, url) || fallback;
};
