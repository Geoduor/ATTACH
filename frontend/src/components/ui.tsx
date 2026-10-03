import type { ReactNode } from 'react';

export function MatchScore({
  score,
  verdict,
  size = 'md',
}: {
  score: number;
  verdict?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const tone =
    score >= 82
      ? { ring: 'border-emerald-200 bg-emerald-50 text-emerald-800', bar: 'bg-emerald-500' }
      : score >= 68
        ? { ring: 'border-brand-200 bg-brand-50 text-brand-800', bar: 'bg-brand-500' }
        : score >= 50
          ? { ring: 'border-amber-200 bg-amber-50 text-amber-800', bar: 'bg-amber-500' }
          : { ring: 'border-slate-200 bg-slate-50 text-slate-600', bar: 'bg-slate-400' };

  const dims =
    size === 'lg'
      ? 'h-14 w-14 text-lg'
      : size === 'sm'
        ? 'h-10 w-10 text-xs'
        : 'h-12 w-12 text-sm';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative grid shrink-0 place-items-center rounded-full border-2 font-bold tabular-nums ${tone.ring} ${dims}`}
        role="img"
        aria-label={`Match score ${score} out of 100`}
      >
        {score}
      </div>
      <div className="min-w-0">
        {verdict ? <p className="text-sm font-semibold text-slate-900">{verdict}</p> : null}
        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${tone.bar}`}
            style={{ width: `${Math.max(3, score)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const COMPONENT_TONE = {
  strong: 'bg-emerald-500',
  good: 'bg-brand-500',
  neutral: 'bg-amber-500',
  weak: 'bg-slate-400',
} as const;

const COMPONENT_TEXT = {
  strong: 'text-emerald-700',
  good: 'text-brand-700',
  neutral: 'text-amber-700',
  weak: 'text-slate-600',
} as const;

export function MatchBreakdown({
  components,
}: {
  components: Array<{
    key: string;
    label: string;
    score: number;
    weight: number;
    status: keyof typeof COMPONENT_TONE;
    detail: string;
  }>;
}) {
  return (
    <dl className="space-y-3">
      {components.map((c) => (
        <div key={c.key}>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-medium text-slate-800">
              {c.label}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {Math.round(c.weight * 100)}% of score
              </span>
            </dt>
            <dd
              className={`text-sm font-bold tabular-nums ${COMPONENT_TEXT[c.status]}`}
            >
              {c.score}
            </dd>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${COMPONENT_TONE[c.status]}`}
              style={{ width: `${Math.max(2, c.score)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{c.detail}</p>
        </div>
      ))}
    </dl>
  );
}

export function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'brand' | 'emerald' | 'amber' | 'red' | 'violet';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;

  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Deadline({ days }: { days: number | null }) {
  if (days === null) return <Pill tone="slate">No deadline</Pill>;
  if (days < 0) return <Pill tone="red">Closed</Pill>;
  if (days === 0) return <Pill tone="red">Closes today</Pill>;
  if (days <= 7) return <Pill tone="amber">{days} days left</Pill>;
  if (days <= 30) return <Pill tone="amber">{days} days left</Pill>;
  return <Pill tone="emerald">{days} days left</Pill>;
}

export function Alert({
  tone = 'brand',
  title,
  children,
}: {
  tone?: 'brand' | 'emerald' | 'amber' | 'red';
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    brand: 'border-brand-200 bg-brand-50 text-brand-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`} role="status">
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}