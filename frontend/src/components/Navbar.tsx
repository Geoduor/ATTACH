'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { hasSupabase } from '@/utils/config';

const LINKS = [
  { href: '/opportunities', label: 'Find placements' },
  { href: '/applications', label: 'My applications' },
  { href: '/profile', label: 'My profile' },
];

export function Navbar({ user }: { user: { email: string; fullName: string } | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              AK
            </span>
            <span className="hidden text-base font-bold text-slate-900 sm:inline">
              AttachKenya
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 lg:inline">
                {user.fullName}
              </span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-secondary">
                  Sign out
                </button>
              </form>
            </>
          ) : hasSupabase ? (
            <>
              <Link href="/auth/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get started
              </Link>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary">
              Demo sign in
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}