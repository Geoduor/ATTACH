import Link from 'next/link';
import { redirect } from 'next/navigation';

import { OpportunityCard } from '@/components/OpportunityCard';
import { EmptyState } from '@/components/ui';
import { getSessionUser, getStudentProfile, scoreOpportunities } from '@/utils/data';

export const metadata = { title: 'Opportunities' };

const INDUSTRY_ALL = 'all';
const LOCATION_ALL = 'all';

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; location?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const profile = user ? await getStudentProfile(user.id) : null;

  const scored = await scoreOpportunities(profile);

  const industries = [
    ...new Set(scored.map((o) => o.industry?.name).filter((v): v is string => !!v)),
  ].sort();
  const locations = [
    ...new Set(scored.map((o) => o.location)),
  ].sort();

  const q = (params.q ?? '').trim().toLowerCase();

  const filtered = scored.filter((o) => {
    if (params.industry && params.industry !== INDUSTRY_ALL && o.industry?.name !== params.industry) {
      return false;
    }
    if (params.location && params.location !== LOCATION_ALL && o.location !== params.location) {
      return false;
    }
    if (q) {
      const haystack = [
        o.title,
        o.company?.name ?? '',
        o.description ?? '',
        o.location,
        o.industry?.name ?? '',
        ...o.requiredSkillNames,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sort = params.sort ?? 'match';
  const ordered = filtered.slice().sort((a, b) => {
    if (sort === 'deadline') {
      return (
        (a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity) -
        (b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity)
      );
    }
    if (sort === 'company') {
      return (a.company?.name ?? '').localeCompare(b.company?.name ?? '');
    }
    return b.match.overall - a.match.overall;
  });

  const appliedIds = new Set<string>();
  if (profile) {
    const { getApplications } = await import('@/utils/data');
    const apps = await getApplications(profile.id);
    apps.forEach((a) => appliedIds.add(a.opportunity_id));
  }

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Open placements</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile
              ? `Scored against your ${profile.course?.name ?? 'profile'} profile.`
              : 'Sign in and complete your profile to see match scores.'}
          </p>
        </div>
        <p className="text-sm font-medium tabular-nums text-slate-500">
          {ordered.length} of {scored.length}
        </p>
      </header>

      <form
        method="get"
        className="card mt-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label htmlFor="q" className="label">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Company, title, skill…"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="industry" className="label">
            Industry
          </label>
          <select
            id="industry"
            name="industry"
            defaultValue={params.industry ?? INDUSTRY_ALL}
            className="input"
          >
            <option value={INDUSTRY_ALL}>All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="label">
            Location
          </label>
          <select
            id="location"
            name="location"
            defaultValue={params.location ?? LOCATION_ALL}
            className="input"
          >
            <option value={LOCATION_ALL}>All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="label">
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={sort} className="input">
            <option value="match">Best match</option>
            <option value="deadline">Closing soonest</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>

        <div className="flex items-end gap-2 lg:col-span-5">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <Link href="/opportunities" className="btn-ghost">
            Reset
          </Link>
        </div>
      </form>

      {ordered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No placements match those filters"
            description="Try clearing the industry or location filter, or search a broader term."
            action={
              <Link href="/opportunities" className="btn-secondary mt-2">
                Clear filters
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              match={profile ? o.match : null}
              isSignedIn={!!user}
              hasProfile={!!profile}
              applied={appliedIds.has(o.id)}
            />
          ))}
        </div>
      )}

      {!user ? (
        <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              You are seeing unscored listings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Match scores need a profile to compare against.
            </p>
          </div>
          <Link href="/auth/signup" className="btn-primary">
            Create free profile
          </Link>
        </div>
      ) : null}
    </div>
  );
}