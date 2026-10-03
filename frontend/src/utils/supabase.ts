/**
 * Supabase clients.
 *
 * - `createServerSupabaseClient` — for React Server Components / Route Handlers.
 *   Reads the auth cookie so the session survives SSR.
 * - `createBrowserSupabaseClient` — for Client Components.
 *
 * Both are no-ops (return null) when credentials are absent, which is how the
 * app stays runnable in demo mode.
 */

import { cookies } from 'next/headers';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './config';

export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const cookieStore = await cookies();

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: middleware refreshes the session instead.
        }
      },
    },
  });
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Service-role client. Bypasses RLS, so it must only ever be constructed in
 * server code (Route Handlers / Server Components), never in a client bundle.
 */
export async function createServiceRoleClient(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}