import { supabase } from '../lib/supabase.js';
import {
  recordOfflineDownload,
  saveOfflineMediaBlob,
  formatStorageSize
} from './offlineStorageService.js';

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

  // 3. Storage Quota Pre-check (prevents partial corrupt downloads)
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const availableBytes = estimate.quota - estimate.usage;
        if (availableBytes < 15 * 1024 * 1024) {
          return {
            success: false,
            error: 'Not enough device storage available for this download.'
          };
        }
      }
    } catch (quotaErr) {
      console.warn('[AccessControl] Storage estimate check note:', quotaErr);
    }
  }

  const contentId = String(content.id || content.db_id || content.slug);
  const isVideo = content.contentType === 'video' || content.type === 'video';

  const reportProgress = (percent, receivedBytes, totalBytes) => {
    const detail = {
      contentId,
      percent,
      receivedBytes,
      totalBytes,
      type: isVideo ? 'video' : 'audio'
    };
    if (typeof onProgress === 'function') {
      onProgress(detail);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('drcubie_download_progress', { detail }));
    }
  };

  try {
    // 4. Resolve authorized download URL
    let downloadUrl = targetUrl;
    if (supabase && !targetUrl.startsWith('/') && !targetUrl.startsWith('data:') && !targetUrl.startsWith('blob:')) {
      const authorizedUrl = await getAuthorizedMediaUrl({
        mediaUrl: targetUrl,
        user,
        profile,
        isVip: true,
        content,
        expiresIn: 3600
      });

      if (!authorizedUrl) {
        return {
          success: false,
          error: 'Could not obtain authorized download access.'
        };
      }
      downloadUrl = authorizedUrl;
    }

    // 5. Stream media bytes with real-time progress tracking
    reportProgress(0, 0, 0);

    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`Failed to retrieve media file: ${res.status} ${res.statusText}`);
    }

    const contentLengthHeader = res.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    // Check quota against actual Content-Length if provided
    if (totalBytes > 0 && typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.usage) {
          if (estimate.quota - estimate.usage < totalBytes) {
            return {
              success: false,
              error: 'Not enough device storage available for this download.'
            };
          }
        }
      } catch {
        // proceed
      }
    }

    const defaultExt = isVideo ? 'mp4' : 'mp3';
    const ext = targetUrl.split('?')[0].split('.').pop() || defaultExt;
    const fileName = `${(content.title || 'vip-media').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_')}.${ext}`;
    const mimeType = res.headers.get('content-type') || (isVideo ? 'video/mp4' : 'audio/mpeg');

    let blob = null;

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const chunks = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;

        const pct = totalBytes > 0 ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100)) : null;
        reportProgress(pct, receivedBytes, totalBytes);
      }

      blob = new Blob(chunks, { type: mimeType });
    } else {
      // Fallback if ReadableStream is not available
      blob = await res.blob();
    }

    if (!blob || blob.size <= 0) {
      throw new Error('Downloaded media file was empty or corrupted.');
    }

    // 6. Save actual media Blob into IndexedDB
    const savedRecord = await saveOfflineMediaBlob({
      userId: user.id,
      content,
      blob,
      mimeType,
      fileName
    });

    reportProgress(100, blob.size, blob.size);

    return {
      success: true,
      fileName,
      sizeBytes: blob.size,
      formattedSize: formatStorageSize(blob.size),
      item: savedRecord
    };
  } catch (err) {
    console.error('[AccessControl] Error executing VIP download:', err);
    reportProgress(null, 0, 0);
    return {
      success: false,
      error: err.message || 'Download failed due to a network connection error.'
    };
  }
};
