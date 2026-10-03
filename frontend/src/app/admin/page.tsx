import Link from 'next/link';

import { Alert } from '@/components/ui';
import { dataMode } from '@/utils/config';
import { getOpportunities } from '@/utils/data';

export const metadata = { title: 'For employers' };

export default async function AdminPage() {
  const opportunities = await getOpportunities();

  const byMethod = opportunities.reduce<Record<string, number>>((acc, o) => {
    const key = o.application_method ?? 'not stated';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const byIndustry = opportunities.reduce<Record<string, number>>((acc, o) => {
    const key = o.industry?.name ?? 'Unclassified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">For employers</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        AttachKenya matches placements to students by course, skills and availability.
        Post a role and it reaches only the students it genuinely suits.
      </p>

      {dataMode === 'demo' ? (
        <div className="mt-6">
          <Alert tone="amber" title="Demo mode">
            This is the read-only view. Posting a placement requires Supabase, since new
            rows need to persist. Connect Supabase and the form below becomes live.
          </Alert>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Live listings" value={String(opportunities.length)} />
        <StatCard
          label="Employers"
          value={String(new Set(opportunities.map((o) => o.company_id)).size)}
        />
        <StatCard
          label="Sectors covered"
          value={String(Object.keys(byIndustry).length)}
        />
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900">Post a placement</h2>
          <p className="mt-2 text-sm text-slate-600">
            You will need: title, description, duration, deadline, application route, and
            the courses you accept. Skills are picked from the shared taxonomy so matching
            works properly — free text does not.
          </p>
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            The posting form is the next piece of work. For now, add placements directly in
            Supabase and they will appear here and in the matching engine immediately.
          </p>
          <Link href="/opportunities" className="btn-secondary mt-4">
            Browse live listings
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900">Where your students land</h2>
          <p className="mt-2 text-sm text-slate-600">
            Current demand across live listings, by application route and sector.
          </p>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            By application route
          </h3>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(byMethod)
              .sort((a, b) => b[1] - a[1])
              .map(([method, n]) => (
                <li key={method} className="flex justify-between text-sm">
                  <span className="capitalize text-slate-600">{method}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{n}</span>
                </li>
              ))}
          </ul>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            By sector
          </h3>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(byIndustry)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([industry, n]) => (
                <li key={industry} className="flex justify-between text-sm">
                  <span className="text-slate-600">{industry}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{n}</span>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}