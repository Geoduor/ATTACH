/**
 * Runtime configuration.
 *
 * The app is designed to boot with ZERO credentials: if Supabase or the
 * Claude API key are missing it falls back to an in-process demo dataset and
 * a deterministic matcher. That means `npm run dev` works immediately, and
 * adding credentials upgrades the same code to the real thing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

/** Never prefixed NEXT_PUBLIC_ — must stay on the server. */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.trim() ?? '';

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5';

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const hasServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY);
export const hasClaude = Boolean(ANTHROPIC_API_KEY);

export type DataMode = 'supabase' | 'demo';
export type AiMode = 'claude' | 'rules';

export const dataMode: DataMode = hasSupabase ? 'supabase' : 'demo';
export const aiMode: AiMode = hasClaude ? 'claude' : 'rules';

export const DEMO_EMAIL = 'student@tukenya.ac.ke';
export const DEMO_PASSWORD = 'demo1234';