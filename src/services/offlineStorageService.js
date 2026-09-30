/**
 * Offline Media Storage Tracking Service
 * Manages user offline downloaded assets with persistent client-side tracking.
 */

/**
 * Format bytes to human-readable size (e.g. 14.5 MB, 1.2 GB)
 */
export const formatStorageSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * Retrieves all offline downloaded items for a user.
 */
export const getOfflineDownloads = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`drcubie_offline_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[OfflineStorageService] getOfflineDownloads error:', err);
  }
  return [];
};

/**
 * Computes total offline storage summary for a user.
 */
export const getTotalOfflineStorage = (userId) => {
  const items = getOfflineDownloads(userId);
  const totalBytes = items.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);
  return {
    items,
    count: items.length,
    totalBytes,
    formattedSize: formatStorageSize(totalBytes)
  };
};

/**
 * Adds or updates an offline download record for a user.
 */
export const recordOfflineDownload = (userId, content, sizeBytes = 0, fileName = '') => {
  if (!userId || !content) return;
  try {
    const existing = getOfflineDownloads(userId);
    const contentId = content.id || content.db_id || content.slug;

    // Filter out previous entry if re-downloaded
    const filtered = existing.filter((item) => item.id !== contentId);

    // If sizeBytes is 0 or missing, estimate realistic file size based on type / duration
    let resolvedBytes = sizeBytes;
    if (!resolvedBytes || resolvedBytes <= 0) {
      const durationSec = content.durationSeconds || 180;
      if (content.contentType === 'video' || content.type === 'video') {
        resolvedBytes = durationSec * 250000; // ~2 Mbps for video
      } else {
        resolvedBytes = durationSec * 16000; // ~128 kbps for audio
      }
    }

    const newItem = {
      id: contentId,
      title: content.title || 'VIP Contemplation',
      type: content.contentType || content.type || 'audio',
      category: content.category || content.categoryLabel || 'Mindfulness',
      sizeBytes: resolvedBytes,
      formattedSize: formatStorageSize(resolvedBytes),
      fileName: fileName || `${content.title || 'media'}.${content.contentType === 'video' ? 'mp4' : 'mp3'}`,
      downloadedAt: new Date().toISOString()
    };

    filtered.unshift(newItem);
    localStorage.setItem(`drcubie_offline_${userId}`, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drcubie_offline_updated', {
          detail: { userId, count: filtered.length }
        })
      );
    }

    return newItem;
  } catch (err) {
    console.warn('[OfflineStorageService] recordOfflineDownload error:', err);
  }
};

/**
 * Removes an item from offline storage records.
 */
export const removeOfflineDownload = (userId, contentId) => {
  if (!userId || !contentId) return;
  try {
    const existing = getOfflineDownloads(userId);
    const filtered = existing.filter((item) => item.id !== contentId);
    localStorage.setItem(`drcubie_offline_${userId}`, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drcubie_offline_updated', {
          detail: { userId, count: filtered.length }
        })
      );
    }
  } catch (err) {
    console.warn('[OfflineStorageService] removeOfflineDownload error:', err);
  }
};

/**
 * Clears all offline downloads for a user.
 */
export const clearAllOfflineDownloads = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(`drcubie_offline_${userId}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drcubie_offline_updated', {
          detail: { userId, count: 0 }
        })
      );
    }
  } catch (err) {
    console.warn('[OfflineStorageService] clearAllOfflineDownloads error:', err);
  }
};
