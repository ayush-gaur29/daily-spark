/**
 * Offline Media Storage Tracking & IndexedDB Media Service
 * Manages true client-side persistent media storage (Audio & Video Blobs)
 * enabling genuine offline playback in Dr. Cubie Inspiration.
 */

const DB_NAME = 'DrCubieOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

let dbInstance = null;

/**
 * Initializes and opens the IndexedDB database for offline media storage.
 * Safe for SSR and environments without IndexedDB.
 */
export const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this platform.'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('contentId', 'contentId', { unique: false });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[OfflineStorageService] IndexedDB open error:', event.target.error);
      reject(event.target.error || new Error('Failed to open offline media database.'));
    };
  });
};

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
 * Generates the user-scoped compound storage key.
 */
export const getStorageKey = (userId, contentId) => {
  return `${userId}::${contentId}`;
};

/**
 * Saves a real audio or video media Blob and its associated metadata into IndexedDB.
 * Updates local metadata cache for immediate synchronous rendering.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {Object} params.content - Content metadata object
 * @param {Blob} params.blob - The downloaded media Blob
 * @param {string} [params.mimeType] - MIME type of the media file
 * @param {string} [params.fileName] - Name of the downloaded file
 * @returns {Promise<Object>} The stored offline item metadata
 */
export const saveOfflineMediaBlob = async ({
  userId,
  content,
  blob,
  mimeType = '',
  fileName = ''
}) => {
  if (!userId) throw new Error('User ID is required to save offline media.');
  if (!content) throw new Error('Content metadata is required.');
  if (!(blob instanceof Blob) || blob.size <= 0) {
    throw new Error('A valid media Blob is required for offline storage.');
  }

  const contentId = String(content.id || content.db_id || content.slug);
  const key = getStorageKey(userId, contentId);
  const isVideo = content.contentType === 'video' || content.type === 'video';
  const resolvedType = isVideo ? 'video' : 'audio';

  const record = {
    key,
    userId,
    contentId,
    id: contentId,
    title: content.title || 'VIP Contemplation',
    type: resolvedType,
    contentType: resolvedType,
    category: content.category || content.categoryLabel || 'Mindfulness',
    thumbnailUrl: content.thumbnailUrl || content.thumbnail_url || content.poster || '',
    duration: content.duration || '',
    durationSeconds: content.durationSeconds || 0,
    sizeBytes: blob.size,
    formattedSize: formatStorageSize(blob.size),
    fileName: fileName || `${content.title || 'media'}.${isVideo ? 'mp4' : 'mp3'}`,
    mimeType: mimeType || blob.type || (isVideo ? 'video/mp4' : 'audio/mpeg'),
    blob,
    downloadedAt: new Date().toISOString(),
    isPlayableOffline: true
  };

  const db = await openOfflineDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
    tx.onerror = (e) => reject(e.target.error);
  });

  // Update lightweight synchronous metadata cache in localStorage
  try {
    const existing = getOfflineDownloads(userId);
    const filtered = existing.filter((item) => item.id !== contentId);

    const metadataOnly = {
      id: contentId,
      title: record.title,
      type: record.type,
      category: record.category,
      thumbnailUrl: record.thumbnailUrl,
      duration: record.duration,
      sizeBytes: record.sizeBytes,
      formattedSize: record.formattedSize,
      fileName: record.fileName,
      mimeType: record.mimeType,
      downloadedAt: record.downloadedAt,
      isPlayableOffline: true
    };

    filtered.unshift(metadataOnly);
    localStorage.setItem(`drcubie_offline_${userId}`, JSON.stringify(filtered));
  } catch (cacheErr) {
    console.warn('[OfflineStorageService] Metadata cache sync note:', cacheErr);
  }

  // Dispatch global notification event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('drcubie_offline_updated', {
        detail: { userId, contentId, action: 'added' }
      })
    );
  }

  return record;
};

/**
 * Retrieves the full stored record (including the actual Blob) from IndexedDB.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} contentId - Content ID
 * @returns {Promise<Object|null>}
 */
export const getOfflineMediaRecord = async (userId, contentId) => {
  if (!userId || !contentId) return null;
  try {
    const db = await openOfflineDB();
    const key = getStorageKey(userId, contentId);

    return await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const result = req.result;
        if (result && result.blob instanceof Blob && result.blob.size > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[OfflineStorageService] getOfflineMediaRecord error:', err);
    return null;
  }
};

/**
 * Retrieves only the media Blob for offline playback.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} contentId - Content ID
 * @returns {Promise<Blob|null>}
 */
export const getOfflineMediaBlob = async (userId, contentId) => {
  const record = await getOfflineMediaRecord(userId, contentId);
  return record?.blob || null;
};

/**
 * Checks whether an item is truly downloaded and playable offline for a user.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} contentId - Content ID
 * @returns {Promise<boolean>}
 */
export const hasOfflineMedia = async (userId, contentId) => {
  if (!userId || !contentId) return false;
  const record = await getOfflineMediaRecord(userId, contentId);
  return Boolean(record && record.blob instanceof Blob && record.blob.size > 0);
};

/**
 * Retrieves all offline downloaded items for a user (Synchronous from metadata cache).
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
 * Retrieves all offline downloaded items directly from IndexedDB (Asynchronous & Authoritative).
 * Filters out any incomplete legacy records that lack an actual media Blob.
 * Synchronizes the verified metadata back to localStorage.
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Array>}
 */
export const getOfflineDownloadsAsync = async (userId) => {
  if (!userId) return [];
  try {
    const db = await openOfflineDB();

    const dbRecords = await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('userId');
      const req = index.getAll(IDBKeyRange.only(userId));

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    // Check localStorage for any legacy items that lack Blobs
    const localItems = getOfflineDownloads(userId);
    const dbKeySet = new Set(dbRecords.map((r) => r.contentId || r.id));

    // Valid records that contain actual media Blobs
    const verifiedItems = dbRecords.map((r) => ({
      id: r.contentId || r.id,
      title: r.title,
      type: r.type,
      category: r.category,
      thumbnailUrl: r.thumbnailUrl,
      duration: r.duration,
      sizeBytes: r.sizeBytes || r.blob?.size || 0,
      formattedSize: r.formattedSize || formatStorageSize(r.sizeBytes || r.blob?.size || 0),
      fileName: r.fileName,
      mimeType: r.mimeType,
      downloadedAt: r.downloadedAt,
      isPlayableOffline: true
    }));

    // Identify legacy records that exist only in localStorage without media Blobs
    const legacyItems = localItems
      .filter((loc) => !dbKeySet.has(loc.id))
      .map((loc) => ({
        ...loc,
        isPlayableOffline: false,
        isLegacy: true,
        formattedSize: formatStorageSize(loc.sizeBytes || 0)
      }));

    const combined = [...verifiedItems, ...legacyItems];

    // Synchronize verified metadata cache back to localStorage
    try {
      localStorage.setItem(`drcubie_offline_${userId}`, JSON.stringify(combined));
    } catch {
      // ignore
    }

    return combined;
  } catch (err) {
    console.warn('[OfflineStorageService] getOfflineDownloadsAsync error:', err);
    return getOfflineDownloads(userId);
  }
};

/**
 * Computes total offline storage summary for a user based on metadata cache.
 */
export const getTotalOfflineStorage = (userId) => {
  const items = getOfflineDownloads(userId);
  // Only calculate real playable offline items
  const totalBytes = items.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);
  return {
    items,
    count: items.length,
    playableCount: items.filter((i) => i.isPlayableOffline !== false).length,
    totalBytes,
    formattedSize: formatStorageSize(totalBytes)
  };
};

/**
 * Computes total offline storage summary from IndexedDB (Authoritative).
 */
export const getTotalOfflineStorageAsync = async (userId) => {
  const items = await getOfflineDownloadsAsync(userId);
  const totalBytes = items
    .filter((i) => i.isPlayableOffline !== false)
    .reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);

  return {
    items,
    count: items.length,
    playableCount: items.filter((i) => i.isPlayableOffline !== false).length,
    totalBytes,
    formattedSize: formatStorageSize(totalBytes)
  };
};

/**
 * Adds or updates an offline download metadata record (Preserved for compatibility).
 */
export const recordOfflineDownload = (userId, content, sizeBytes = 0, fileName = '') => {
  if (!userId || !content) return;
  try {
    const existing = getOfflineDownloads(userId);
    const contentId = content.id || content.db_id || content.slug;

    const filtered = existing.filter((item) => item.id !== contentId);

    let resolvedBytes = sizeBytes;
    if (!resolvedBytes || resolvedBytes <= 0) {
      const durationSec = content.durationSeconds || 180;
      if (content.contentType === 'video' || content.type === 'video') {
        resolvedBytes = durationSec * 250000;
      } else {
        resolvedBytes = durationSec * 16000;
      }
    }

    const newItem = {
      id: contentId,
      title: content.title || 'VIP Contemplation',
      type: content.contentType || content.type || 'audio',
      category: content.category || content.categoryLabel || 'Mindfulness',
      thumbnailUrl: content.thumbnailUrl || content.thumbnail_url || content.poster || '',
      sizeBytes: resolvedBytes,
      formattedSize: formatStorageSize(resolvedBytes),
      fileName: fileName || `${content.title || 'media'}.${content.contentType === 'video' ? 'mp4' : 'mp3'}`,
      downloadedAt: new Date().toISOString(),
      isPlayableOffline: true
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
 * Removes an item from both IndexedDB media storage and localStorage metadata.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} contentId - Content ID
 */
export const removeOfflineDownload = async (userId, contentId) => {
  if (!userId || !contentId) return;

  // 1. Remove from IndexedDB
  try {
    const db = await openOfflineDB();
    const key = getStorageKey(userId, contentId);

    await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (dbErr) {
    console.warn('[OfflineStorageService] IndexedDB delete note:', dbErr);
  }

  // 2. Remove from localStorage cache
  try {
    const existing = getOfflineDownloads(userId);
    const filtered = existing.filter((item) => item.id !== contentId);
    localStorage.setItem(`drcubie_offline_${userId}`, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drcubie_offline_updated', {
          detail: { userId, count: filtered.length, action: 'removed', contentId }
        })
      );
    }
  } catch (err) {
    console.warn('[OfflineStorageService] removeOfflineDownload error:', err);
  }
};

/**
 * Clears all offline downloads for a user from both IndexedDB and localStorage.
 *
 * @param {string} userId - Authenticated user ID
 */
export const clearAllOfflineDownloads = async (userId) => {
  if (!userId) return;

  // 1. Clear user records from IndexedDB
  try {
    const db = await openOfflineDB();

    await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('userId');
      const req = index.openCursor(IDBKeyRange.only(userId));

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      req.onerror = () => resolve(false);
    });
  } catch (dbErr) {
    console.warn('[OfflineStorageService] IndexedDB clear note:', dbErr);
  }

  // 2. Clear from localStorage cache
  try {
    localStorage.removeItem(`drcubie_offline_${userId}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drcubie_offline_updated', {
          detail: { userId, count: 0, action: 'cleared' }
        })
      );
    }
  } catch (err) {
    console.warn('[OfflineStorageService] clearAllOfflineDownloads error:', err);
  }
};
