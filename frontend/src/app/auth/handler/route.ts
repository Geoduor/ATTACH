import { NextResponse } from 'next/server';

import { dataMode } from '@/utils/config';
import { createServerSupabaseClient } from '@/utils/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeNext(value: unknown): string {
  // Only allow same-origin relative paths, so `?next=` cannot be used as an
  // open redirect to an attacker's site.
  if (typeof value !== 'string') return '/dashboard';
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const action = body.action;
  const redirectTo = safeNext(body.next);

  if (action !== 'login' && action !== 'signup') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName =
    typeof body.fullName === 'string' ? body.fullName.trim() : '';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  if (dataMode === 'demo') {
    return NextResponse.json({
      error:
        'Supabase is not configured, so email sign-in is disabled. Use "Continue as demo student".',
    }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Auth is unavailable.' }, { status: 503 });
  }

  if (action === 'signup') {
    if (!fullName) {
      return NextResponse.json({ error: 'Enter your full name.' }, { status: 400 });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Returning a session directly skips email confirmation. If you have
        // confirmation enabled in Supabase, `session` comes back null instead
        // and the user must confirm first.
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, redirect: redirectTo });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? 'That email and password do not match an account.'
        : error.message;
    return NextResponse.json({ error: message }, { status: 401 });
  }

  return NextResponse.json({ ok: true, redirect: redirectTo });
}