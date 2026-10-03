import { NextResponse, type NextRequest } from 'next/server';

import { createServerSupabaseClient } from '@/utils/supabase';

export async function middleware(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Nothing to refresh when Supabase is not configured (demo mode).
  if (!supabase) return NextResponse.next();

  // Refreshing the token also updates cookies, which is why this cannot run in
  // a Server Component.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/auth');

  if (!user && !isAuthPage && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   - _next/static, _next/image  (build output)
     *   - favicon.ico, and common static assets
     *   - api routes, which do their own auth checks per handler
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api).*)',
  ],
};