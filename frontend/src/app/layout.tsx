import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

import { Navbar } from '@/components/Navbar';
import { getSessionUser } from '@/utils/data';
import { aiMode, dataMode } from '@/utils/config';

export const metadata: Metadata = {
  title: {
    default: 'AttachKenya — find your industrial attachment',
    template: '%s · AttachKenya',
  },
  description:
    'Match Kenyan university students with industrial attachment and internship opportunities based on course, skills and availability.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en-KE">
      <body className="min-h-screen flex flex-col">
        <Navbar
          user={user ? { email: user.email, fullName: user.fullName } : null}
        />

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="container-page py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-bold text-slate-900">AttachKenya</p>
                <p className="mt-2 text-sm text-slate-500">
                  Helping Kenyan students find attachments that actually fit their
                  course instead of whatever advert came up first.
                </p>
              </div>
              <FooterCol
                title="For students"
                links={[
                  ['Find placements', '/opportunities'],
                  ['My profile', '/profile'],
                  ['My applications', '/applications'],
                ]}
              />
              <FooterCol
                title="For employers"
                links={[
                  ['Post an opportunity', '/admin'],
                  ['How matching works', '/how-it-works'],
                ]}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Status</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>
                    Data:{' '}
                    <span className="font-medium text-slate-800">
                      {dataMode === 'supabase' ? 'Supabase (live)' : 'Demo dataset'}
                    </span>
                  </li>
                  <li>
                    AI:{' '}
                    <span className="font-medium text-slate-800">
                      {aiMode === 'claude' ? 'Claude (live)' : 'Rule-based'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">
              AttachKenya · Attachment and internship matching for Kenyan students
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-slate-600 hover:text-slate-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}