import Link from 'next/link';

import { Alert, EmptyState, MatchScore, Pill } from '@/components/ui';
import { aiMode } from '@/utils/config';
import {
  daysUntil,
  getApplications,
  getSessionUser,
  getStudentProfile,
  scoreOpportunities,
} from '@/utils/data';
import type { ApplicationStatus } from '@/utils/types';

export const metadata = { title: 'Dashboard' };

const OPEN_STATUSES: ApplicationStatus[] = [
  'draft',
  'submitted',
  'pending',
  'reviewed',
  'interviewed',
];

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Sign in to see your dashboard"
          description="Your dashboard tracks your profile, your best-fit placements and every application you have sent."
          action={
            <div className="mt-2 flex gap-3">
              <Link href="/auth/login" className="btn-primary">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-secondary">
                Create account
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const profile = await getStudentProfile(user.id);

  if (!profile) {
    return (
      <div className="container-page py-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {user.fullName.split(' ')[0]}
        </h1>
        <div className="mt-6">
          <EmptyState
            title="Create your profile to unlock scoring"
            description="Add your programme, skills and availability. It takes about ten minutes and every placement gets scored against it."
            action={
              <Link href="/profile" className="btn-primary mt-2">
                Create profile
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const [scored, applications] = await Promise.all([
    scoreOpportunities(profile),
    getApplications(profile.id),
  ]);

  const top = scored.filter((o) => o.match.overall >= 50).slice(0, 5);
  const active = applications.filter((a) => OPEN_STATUSES.includes(a.status));
  const accepted = applications.filter((a) => a.status === 'accepted');
  const closingSoon = scored.filter((o) => {
    const d = daysUntil(o.application_deadline);
    return d !== null && d >= 0 && d <= 21 && !applications.some((a) => a.opportunity_id === o.id);
  });

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Hi, {user.fullName.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.course?.name} · Year {profile.year_of_study} ·{' '}
            {profile.university?.abbreviation ?? profile.university?.name}
          </p>
        </div>
        <Link href="/opportunities" className="btn-primary">
          Browse all {scored.length} placements
        </Link>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Best match"
          value={top[0] ? String(top[0].match.overall) : '—'}
          sub={top[0]?.match.verdict ?? 'Add skills to score'}
        />
        <Stat
          label="Good fits (50+)"
          value={String(scored.filter((o) => o.match.overall >= 50).length)}
          sub="Worth applying to"
        />
        <Stat
          label="Applications open"
          value={String(active.length)}
          sub={accepted.length ? `${accepted.length} accepted` : 'Awaiting response'}
        />
        <Stat
          label="Closing in 3 weeks"
          value={String(closingSoon.length)}
          sub="Not applied to yet"
        />
      </dl>

      {closingSoon.length > 0 ? (
        <div className="mt-8">
          <Alert tone="amber" title="Deadlines approaching">
            {closingSoon.length} placement{closingSoon.length === 1 ? '' : 's'} you have
            not applied to {closingSoon.length === 1 ? 'closes' : 'close'} within three
            weeks.{' '}
            <Link href="/opportunities" className="font-semibold underline">
              Review them
            </Link>
          </Alert>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Your best fits</h2>
            <Link
              href="/opportunities"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              See all
            </Link>
          </div>

          {top.length === 0 ? (
            <div className="card mt-4 p-6">
              <p className="text-sm text-slate-600">
                Nothing scores above 50 yet. The most common cause is a thin skill list —
                go back to your profile and add everything you can defend in an interview.
              </p>
              <Link href="/profile" className="btn-secondary mt-4">
                Edit profile
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {top.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-brand-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {o.title}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {o.company?.name} · {o.location} ·{' '}
                        {daysUntil(o.application_deadline) ?? '—'} days left
                      </p>
                      <p className="mt-1.5 line-clamp-1 text-xs text-slate-400">
                        {o.match.summary}
                      </p>
                    </div>
                    <MatchScore score={o.match.overall} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Profile completeness</h2>
            <ul className="mt-3 space-y-2">
              <ChecklistItem done={profile.skills.length >= 5}>
                {profile.skills.length >= 5
                  ? `${profile.skills.length} skills listed`
                  : `Only ${profile.skills.length} skills — add more`}
              </ChecklistItem>
              <ChecklistItem done={!!profile.cv_link}>CV link added</ChecklistItem>
              <ChecklistItem done={!!profile.portfolio_link}>
                Portfolio link added
              </ChecklistItem>
              <ChecklistItem done={profile.preferredLocations.length > 0}>
                Location preference set
              </ChecklistItem>
              <ChecklistItem done={!!profile.bio}>Bio written</ChecklistItem>
            </ul>
            <Link href="/profile" className="btn-secondary mt-4 w-full">
              Edit profile
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Recent applications</h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nothing sent yet.{' '}
                <Link href="/opportunities" className="text-brand-700 hover:underline">
                  Find a placement
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {applications.slice(0, 4).map((a) => (
                  <li key={a.id} className="text-sm">
                    <Link
                      href="/applications"
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {a.opportunity?.title ?? 'Removed placement'}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Pill
                        tone={
                          a.status === 'accepted'
                            ? 'emerald'
                            : a.status === 'rejected'
                              ? 'red'
                              : 'slate'
                        }
                      >
                        {a.status}
                      </Pill>
                      {a.match_score ? (
                        <span className="text-xs tabular-nums text-slate-400">
                          scored {Math.round(a.match_score)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/applications" className="btn-ghost mt-4 w-full">
              View all applications
            </Link>
          </div>

          {aiMode === 'rules' ? (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-900">AI mode</h2>
              <p className="mt-2 text-sm text-slate-500">
                No <code className="text-xs">ANTHROPIC_API_KEY</code> set, so letters and
                analyses use built-in templates. Scores are identical either way.
              </p>
              <Link href="/how-it-works" className="btn-ghost mt-3 w-full">
                How this works
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{value}</dd>
      <dd className="mt-0.5 text-xs text-slate-500">{sub}</dd>
    </div>
  );
}

function ChecklistItem({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
          done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-slate-600' : 'text-slate-500'}>{children}</span>
    </li>
  );
}