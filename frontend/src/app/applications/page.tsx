import type { Metadata } from 'next';
import Link from 'next/link';

import { ApplicationsList } from '@/components/ApplicationsList';
import { EmptyState } from '@/components/ui';
import { getApplications, getSessionUser, getStudentProfile } from '@/utils/data';

export const metadata: Metadata = { title: 'My applications' };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Sign in to see your applications"
          description="Everything you have sent, with status and follow-up notes in one place."
          action={
            <Link href="/auth/login" className="btn-primary mt-2">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  const profile = await getStudentProfile(user.id);
  if (!profile) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="No profile yet"
          description="Create your profile before tracking applications."
          action={
            <Link href="/profile" className="btn-primary mt-2">
              Create profile
            </Link>
          }
        />
      </div>
    );
  }

  const all = await getApplications(profile.id);
  const applications = status ? all.filter((a) => a.status === status) : all;

  const counts = all.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {all.length} tracked · {counts.accepted ?? 0} accepted ·{' '}
            {counts.interviewed ?? 0} at interview stage
          </p>
        </div>
        <Link href="/opportunities" className="btn-primary">
          Find more placements
        </Link>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/applications" active={!status}>
          All ({all.length})
        </FilterChip>
        {Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([s, n]) => (
            <FilterChip key={s} href={`/applications?status=${s}`} active={status === s}>
              {s} ({n})
            </FilterChip>
          ))}
      </nav>

      <div className="mt-8">
        {applications.length === 0 ? (
          <EmptyState
            title={status ? `No ${status} applications` : 'Nothing tracked yet'}
            description={
              status
                ? 'Try a different status filter.'
                : 'Open a placement, generate a cover letter, then mark it as submitted to start tracking it here.'
            }
            action={
              <Link href="/opportunities" className="btn-primary mt-2">
                Browse placements
              </Link>
            }
          />
        ) : (
          <ApplicationsList applications={applications} />
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
      }`}
    >
      {children}
    </Link>
  );
}