import Link from 'next/link';

import { daysUntil } from '@/utils/data';
import { getOpportunities } from '@/utils/data';

export default async function HomePage() {
  const opportunities = await getOpportunities();
  const companies = new Set(opportunities.map((o) => o.company?.name).filter(Boolean));
  const upcoming = opportunities
    .slice()
    .sort((a, b) => (daysUntil(a.application_deadline) ?? 9e9) - (daysUntil(b.application_deadline) ?? 9e9))
    .slice(0, 5);

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="badge bg-white text-brand-700 ring-1 ring-brand-200">
              For Kenyan university students
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Find an attachment that fits your course, not just the first one you see.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              AttachKenya scores every open placement against your programme, skills and
              availability, then shows you exactly why it scored what it did. No guessing,
              no cold applications.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="btn-primary px-6 py-3 text-base">
                Create your profile
              </Link>
              <Link href="/opportunities" className="btn-secondary px-6 py-3 text-base">
                Browse {opportunities.length} placements
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200 pt-8">
              {[
                [String(opportunities.length), 'open placements'],
                [String(companies.size), 'employers'],
                ['5', 'explained score factors'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-bold tabular-nums text-slate-900">{value}</dt>
                  <dd className="mt-0.5 text-sm text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <Feature
            title="Scores you can argue with"
            body="Every placement is broken into course alignment, skills, location, industry and duration. Each factor carries its own weight and its own explanation, so a low score tells you what to fix."
          />
          <Feature
            title="Letters that sound like you"
            body="The cover letter generator uses your actual programme, skills and availability, mapped against that specific job advert. You edit it before it goes anywhere."
          />
          <Feature
            title="Track what you sent"
            body="Log applications, mark status changes, add follow-up dates and keep interview notes in one place. Know exactly what is outstanding."
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="container-page py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Closing soonest
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Deadlines first. Open a placement to see the full breakdown.
              </p>
            </div>
            <Link href="/opportunities" className="text-sm font-semibold text-brand-700 hover:underline">
              View all →
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-slate-100">
            {upcoming.map((o) => {
              const days = daysUntil(o.application_deadline);
              return (
                <li key={o.id}>
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {o.title}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {o.company?.name} · {o.location} · {o.duration_months} months
                      </p>
                    </div>
                    <span className="text-xs font-medium tabular-nums text-slate-500">
                      {days === null ? 'No deadline' : days < 0 ? 'Closed' : `${days} days left`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="card bg-slate-900 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">
            Ten minutes to a complete profile
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Add your university, course, skills and the dates you are free. That is
            enough to score every placement and generate tailored letters.
          </p>
          <Link href="/auth/signup" className="btn-primary mt-7 px-6 py-3 text-base">
            Get started
          </Link>
        </div>
      </section>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}