import { supabase } from '../lib/supabase.js';
import { recordOfflineDownload } from './offlineStorageService.js';

/**
 * Known fallback VIP IDs for videos and sparks to ensure consistency
 * even when offline or using bundled seed data.
 */
const KNOWN_VIP_VIDEO_IDS = new Set([
  'focus-reset',
  'confidence-practice',
  'evening-reflection'
]);

const KNOWN_VIP_SPARK_IDS = new Set([
  'the-power-of-attention',
  'quiet-confidence',
  'intentional-momentum'
]);

/**
 * Evaluates whether a piece of content is classified as VIP.
 * Checks content-level flags (is_vip, isVip), category badges, and known VIP IDs.
 *
 * @param {Object} content - The content item (video, audio, spark, recommendation, or hero)
 * @returns {boolean}
 */
export const isVipContent = (content) => {
  if (!content) return false;

  // Direct boolean flag
  if (content.is_vip === true || content.isVip === true) return true;

  // Type / category checks
  if (content.contentType === 'vip' || content.type === 'vip') return true;
  if (typeof content.category === 'string' && content.category.toLowerCase() === 'vip') return true;
  if (typeof content.categoryBadge === 'string' && content.categoryBadge.toUpperCase() === 'VIP') return true;

  // Nested relation checks (e.g. spark with linked VIP video or audio)
  if (content.video && (content.video.is_vip === true || content.video.isVip === true)) return true;
  if (content.audio && (content.audio.is_vip === true || content.audio.isVip === true)) return true;

  // Known fallback IDs
  const id = content.id || content.db_id || content.contentId || content.slug;
  if (id && (KNOWN_VIP_VIDEO_IDS.has(id) || KNOWN_VIP_SPARK_IDS.has(id))) return true;

  return false;
};

/**
 * Access evaluation statuses:
 * - 'ALLOWED': User is permitted to access/play the content.
 * - 'AUTH_REQUIRED': User must sign in or create an account.
 * - 'VIP_REQUIRED': User is logged in but requires VIP membership.
 *
 * @param {Object} params
 * @param {Object|null} params.user - Authenticated user from Supabase
 * @param {Object|null} params.profile - User profile record from public.profiles
 * @param {boolean} [params.isVip] - VIP boolean from AuthContext
 * @param {Object} params.content - The target content object
 * @returns {{ status: 'ALLOWED' | 'AUTH_REQUIRED' | 'VIP_REQUIRED', allowed: boolean, isVipContent: boolean }}
 */
export const evaluateContentAccess = ({ user, profile, isVip = false, content }) => {
  const vipContent = isVipContent(content);

  // 1. Not logged in -> CANNOT play any protected content
  if (!user) {
    return {
      status: 'AUTH_REQUIRED',
      allowed: false,
      isVipContent: vipContent
    };
  }

  // 2. Normal content for logged-in user -> ALLOWED
  if (!vipContent) {
    return {
      status: 'ALLOWED',
      allowed: true,
      isVipContent: false
    };
  }

  // 3. VIP content -> check user's VIP entitlement
  const userHasVip = Boolean(profile?.is_vip === true || isVip === true);

  if (userHasVip) {
    return {
      status: 'ALLOWED',
      allowed: true,
      isVipContent: true
    };
  }

  // Logged-in normal user attempting VIP content -> VIP_REQUIRED
  return {
    status: 'VIP_REQUIRED',
    allowed: false,
    isVipContent: true
  };
};

/**
 * Parses a Supabase Storage URL and extracts bucket name and object path.
 * Supports public and signed storage paths.
 *
 * @param {string} url
 * @returns {{ bucket: string, path: string } | null}
 */
export const extractStorageBucketAndPath = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
  if (match) {
    return {
      bucket: match[1],
      path: decodeURIComponent(match[2])
    };
  }
  const directMatch = url.match(/^(videos|audio|avatars|images|sparks)\/(.+)$/);
  if (directMatch) {
    return {
      bucket: directMatch[1],
      path: decodeURIComponent(directMatch[2])
    };
  }
  return null;
};

/**
 * Generates an authorized, time-limited signed URL for a protected media file.
 * Prevents direct URL scraping and unauthorized sharing of media assets.
 *
 * @param {Object} params
 * @param {string} params.mediaUrl - The raw media URL or storage path
 * @param {Object|null} params.user - Current user
 * @param {Object|null} params.profile - Current user profile
 * @param {boolean} [params.isVip] - Current user VIP flag
 * @param {Object} params.content - The content object
 * @param {number} [params.expiresIn=3600] - Duration in seconds (default 1 hour)
 * @returns {Promise<string>} - Resolves to signed media URL or empty string if unauthorized
 */
export const getAuthorizedMediaUrl = async ({
  mediaUrl,
  user,
  profile,
  isVip = false,
  content,
  expiresIn = 3600
}) => {
  if (!mediaUrl) return '';

  const access = evaluateContentAccess({ user, profile, isVip, content });
  if (!access.allowed) {
    console.warn('[AccessControl] Media access blocked:', access.status, content?.title || 'Untitled');
    return '';
  }

  // If already a local asset, external CDN, or Supabase is unavailable
  if (!supabase || mediaUrl.startsWith('/') || mediaUrl.startsWith('data:')) {
    return mediaUrl;
  }

  // Attempt to generate a short-lived signed URL for Supabase storage assets
  const parsed = extractStorageBucketAndPath(mediaUrl);
  if (parsed) {
    try {
      const { data, error } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresIn);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.warn('[AccessControl] Error generating signed URL, falling back:', err);
    }
  }

  return mediaUrl;
};

/**
 * Downloads a media file directly from Supabase Storage with strict VIP user entitlement authorization.
 * Premium VIP feature: VIP users can download ALL available audio and video content (both VIP and non-VIP).
 * Non-VIP users cannot download any content.
 *
 * @param {Object} params
 * @param {Object} params.content - Target content item
 * @param {Object|null} params.user - Current user session
 * @param {Object|null} params.profile - Current user profile
 * @param {boolean} [params.isVip=false] - User VIP entitlement
 * @param {string} [params.mediaUrl=null] - Optional override media URL
 * @returns {Promise<{ success: boolean, fileName?: string, error?: string, status?: string }>}
 */
export const downloadVipMediaAsset = async ({
  content,
  user,
  profile,
  isVip = false,
  mediaUrl = null
}) => {
  if (!content) {
    return { success: false, error: 'No content specified for download' };
  }

  // 1. Verify Authentication: Logged-out users cannot download any content
  if (!user) {
    return {
      success: false,
      status: 'AUTH_REQUIRED',
      error: 'Please sign in to download audio and video content.'
    };
  }

  // 2. Verify VIP User Entitlement: Download is a VIP user privilege across all content
  const userIsVip = Boolean(isVip || profile?.is_vip);
  if (!userIsVip) {
    return {
      success: false,
      status: 'VIP_REQUIRED',
      error: 'VIP Sanctuary membership is required to download content.'
    };
  }

  // Resolve target media URL or path
  const targetUrl =
    mediaUrl ||
    content.videoUrl ||
    content.video_url ||
    content.audioUrl ||
    content.audio_url ||
    '';

  if (!targetUrl) {
    return {
      success: false,
      error: 'Media file is not available for download.'
    };
  }

  try {
    let blob = null;
    let fileName = '';

    // 1. Direct Supabase Storage download (most secure and fast)
    const parsed = extractStorageBucketAndPath(targetUrl);
    if (parsed && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(parsed.bucket)
          .download(parsed.path);

        if (!error && data) {
          blob = data;
          const origExt = parsed.path.split('.').pop() || (content.contentType === 'video' || content.type === 'video' ? 'mp4' : 'mp3');
          fileName = `${(content.title || 'vip-media').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_')}.${origExt}`;
        } else if (error) {
          console.warn('[AccessControl] Supabase storage download note:', error.message);
        }
      } catch (storageErr) {
        console.warn('[AccessControl] Storage download exception:', storageErr);
      }
    }

    // 2. Fallback: retrieve authorized signed URL and fetch blob
    if (!blob) {
      const authorizedUrl = await getAuthorizedMediaUrl({
        mediaUrl: targetUrl,
        user,
        profile,
        isVip: true,
        content
      });

      if (!authorizedUrl) {
        return {
          success: false,
          error: 'Could not obtain authorized download access.'
        };
      }

      const res = await fetch(authorizedUrl);
      if (!res.ok) {
        throw new Error(`Failed to retrieve media file: ${res.status} ${res.statusText}`);
      }

      blob = await res.blob();
      const ext = targetUrl.split('?')[0].split('.').pop() || (content.contentType === 'video' || content.type === 'video' ? 'mp4' : 'mp3');
      fileName = `${(content.title || 'vip-media').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_')}.${ext}`;
    }

    // 3. Trigger browser file download
    if (typeof window !== 'undefined' && blob) {
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      if (user?.id) {
        recordOfflineDownload(user.id, content, blob.size, fileName);
      }

      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore
        }
      }, 3000);

      return { success: true, fileName };
    }

    return {
      success: false,
      error: 'Browser download could not be initialized.'
    };
  } catch (err) {
    console.error('[AccessControl] Error executing VIP download:', err);
    return {
      success: false,
      error: err.message || 'Download failed due to a network connection error.'
    };
  }
};
