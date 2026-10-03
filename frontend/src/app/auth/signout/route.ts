import { NextResponse } from 'next/server';

import { demoStore } from '@/utils/demo-data';
import { createServerSupabaseClient } from '@/utils/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sign out.
 * Supabase sessions are cleared via signOut(). In demo mode there is nothing
 * server-side to clear — the session lives in the in-memory store — so we just
 * delete that entry.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  } else {
    demoStore().sessions.delete('demo');
  }

  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}