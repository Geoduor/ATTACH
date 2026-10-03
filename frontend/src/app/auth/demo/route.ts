import { NextResponse } from 'next/server';

import { demoStore } from '@/utils/demo-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Demo-only sign-in. Creates an in-memory session for the demo student. */
export async function POST(request: Request) {
  const store = demoStore();
  const existing = store.sessions.get('demo');

  const user = existing ?? {
    id: 'demo-user',
    email: 'student@tukenya.ac.ke',
    fullName: 'Achieng Odhiambo',
  };

  store.sessions.set('demo', user);

  const target = new URL(request.url).searchParams.get('next');
  const redirectTo =
    target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';

  return NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 });
}