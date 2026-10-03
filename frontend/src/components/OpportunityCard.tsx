import Link from 'next/link';

import type { OpportunityView, StudentProfileView } from '@/utils/types';
import type { MatchAnalysis } from '@/utils/types';
import { Deadline, MatchScore, Pill } from './ui';

interface Props {
  opportunity: OpportunityView;
  match: MatchAnalysis | null;
  isSignedIn: boolean;
  hasProfile: boolean;
  applied: boolean;
}

export function OpportunityCard({
  opportunity: o,
  match,
  isSignedIn,
  hasProfile,
  applied,
}: Props) {
  const company = o.company?.name ?? 'Unknown employer';

  return (
    <article className="card flex flex-col overflow-hidden transition hover:border-brand-300 hover:shadow-md">
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="slate">{company}</Pill>
              {o.industry ? <Pill tone="brand">{o.industry.name}</Pill> : null}
              {applied ? <Pill tone="violet">Applied</Pill> : null}
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900">
              <Link href={`/opportunities/${o.id}`} className="hover:text-brand-700">
                {o.title}
              </Link>
            </h3>
          </div>

          {match && hasProfile ? (
            <MatchScore score={match.overall} verdict={match.verdict} size="sm" />
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          {o.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
          <span>{o.location}</span>
          {o.duration_months ? <span>{o.duration_months} months</span> : null}
          {o.stipend ? <span>{o.stipend}</span> : null}
          <Deadline days={daysUntil(o.application_deadline)} />
        </div>

        {match && hasProfile ? (
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {match.matchedSkills.slice(0, 3).map((s) => (
              <Pill key={s} tone="emerald">
                {s}
              </Pill>
            ))}
            {match.missingSkills.slice(0, 2).map((s) => (
              <Pill key={s} tone="amber">
                + {s}
              </Pill>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
        {!isSignedIn ? (
          <p className="text-xs text-slate-500">
            <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>{' '}
            to see your match score
          </p>
        ) : !hasProfile ? (
          <p className="text-xs text-slate-500">
            <Link href="/profile" className="font-semibold text-brand-700 hover:underline">
              Complete your profile
            </Link>{' '}
            to see your match score
          </p>
        ) : (
          <p className="text-xs text-slate-500">{match?.verdict}</p>
        )}

        <Link href={`/opportunities/${o.id}`} className="btn-secondary text-xs">
          View details
        </Link>
      </div>
    </article>
  );
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

export type { StudentProfileView };