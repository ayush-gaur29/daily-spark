import { supabase } from '../lib/supabase.js';

// Supported MIME types and max size matching Supabase avatars bucket constraints
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates selected avatar file for MIME type and file size.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateAvatarFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  // Check MIME type
  const isTypeValid = ALLOWED_AVATAR_TYPES.includes(file.type);
  if (!isTypeValid) {
    return {
      valid: false,
      error: 'Unsupported image format. Please select a JPG, PNG, or WEBP image.'
    };
  }

  // Check file size
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image size (${sizeMb} MB) exceeds the 5 MB limit. Please choose a smaller image.`
    };
  }

  return { valid: true };
};

/**
 * Helper to get clean file extension.
 * @param {File} file
 * @returns {string}
 */
const getFileExtension = (file) => {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';

  const nameParts = file.name.split('.');
  if (nameParts.length > 1) {
    const ext = nameParts.pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
};

/**
 * Uploads user avatar to the Supabase 'avatars' bucket and updates public.profiles.avatar_url.
 * 
 * Path format: {userId}/avatar-{timestamp}.{ext}
 * Enforces RLS: (storage.foldername(name))[1] = auth.uid()
 * 
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID (must equal auth.uid())
 * @param {File} params.file - Validated image file
 * @returns {Promise<{ publicUrl: string, profile: Object }>}
 */
export const uploadUserAvatar = async ({ userId, file }) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('You must be signed in to update your profile photo.');
  }

  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = getFileExtension(file);
  const timestamp = Date.now();
  const fileName = `avatar-${timestamp}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  // 1. Upload to Supabase Storage 'avatars' bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });

  if (uploadError) {
    console.error('[AvatarService] Storage upload failed:', uploadError);
    if (uploadError.statusCode === '403' || uploadError.message?.includes('security policy')) {
      throw new Error('Permission denied: You can only upload avatars for your own account.');
    }
    if (uploadError.message?.includes('Payload too large') || uploadError.statusCode === '413') {
      throw new Error('Image size is too large for storage. Maximum allowed is 5 MB.');
    }
    throw new Error(uploadError.message || 'Failed to upload photo to storage.');
  }

  // 2. Retrieve public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    throw new Error('Could not resolve public URL for uploaded avatar.');
  }

  // 3. Update public.profiles record for this user only
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
    .single();

  if (profileError) {
    console.error('[AvatarService] Profile record update failed:', profileError);
    // Cleanup the uploaded file to avoid orphan objects if database update fails
    try {
      await supabase.storage.from('avatars').remove([filePath]);
    } catch (cleanupErr) {
      console.warn('[AvatarService] Storage cleanup notice:', cleanupErr);
    }
    throw new Error('Image uploaded, but failed to save to profile record. Please try again.');
  }

  // 4. Asynchronously clean up old avatar files in this user's directory
  cleanupOldAvatars(userId, filePath).catch(err => {
    console.warn('[AvatarService] Old avatar cleanup notice:', err);
  });

  return {
    publicUrl,
    profile: profileData
  };
};

/**
 * Removes older avatar files for a user, leaving only the newly uploaded file.
 * @param {string} userId
 * @param {string} keepFilePath
 */
const cleanupOldAvatars = async (userId, keepFilePath) => {
  if (!supabase || !userId) return;
  try {
    const { data: files, error } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (error || !files || files.length <= 1) return;

    const keepFileName = keepFilePath.split('/').pop();
    const filesToDelete = files
      .filter(f => f.name !== keepFileName && f.name !== '.emptyFolderPlaceholder')
      .map(f => `${userId}/${f.name}`);

    if (filesToDelete.length > 0) {
      await supabase.storage.from('avatars').remove(filesToDelete);
    }
  } catch (err) {
    // Non-critical background cleanup error
  }
};

/**
 * Removes custom avatar and reverts profile to neutral default.
 * @param {string} userId
 * @returns {Promise<{ profile: Object }>}
 */
export const removeUserAvatar = async (userId) => {
  if (!supabase || !userId) {
    throw new Error('User not authenticated.');
  }

  // 1. Update profile to clear avatar_url
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
    .single();

  if (profileError) {
    console.error('[AvatarService] Failed to remove avatar from profile:', profileError);
    throw new Error('Failed to remove profile photo. Please try again.');
  }

  // 2. Remove files in user's avatar folder
  try {
    const { data: files } = await supabase.storage.from('avatars').list(userId);
    if (files && files.length > 0) {
      const paths = files.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(paths);
    }
  } catch (err) {
    console.warn('[AvatarService] Storage cleanup error:', err);
  }

  return { profile: profileData };
};
