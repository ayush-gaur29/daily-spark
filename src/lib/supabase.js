import { createClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase Configuration for Dr. Cubie Inspiration.
 *
 * Configured with browser-safe fallback credentials for the existing project,
 * allowing Cloudflare deployments to connect without requiring manually
 * configured Cloudflare environment variables.
 *
 * Local .env overrides (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or
 * VITE_SUPABASE_PUBLISHABLE_KEY) are preserved and take precedence if defined.
 */

// Browser-safe project credentials for Dr. Cubie Inspiration
// NOTE: Only publishable/anon keys are safe for frontend use. Never use service_role keys.
const SUPABASE_PROJECT_URL = 'https://nflcrjyxgwaedzmlbaqj.supabase.co';
const SUPABASE_PROJECT_PUBLISHABLE_KEY = 'sb_publishable_4lNidlzkIxzMlT8KjvhBaw_FPIqdQ0a';

// Environment variable override -> fallback to project configuration
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  SUPABASE_PROJECT_URL;

const supabasePublishableKey =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  SUPABASE_PROJECT_PUBLISHABLE_KEY;

/**
 * Flag indicating whether Supabase configuration is present.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

/**
 * Centralized Supabase client instance for Dr. Cubie Inspiration app.
 * Can be imported across auth, database, storage, and profile services.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export default supabase;

