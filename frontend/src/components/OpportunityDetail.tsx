'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Alert, MatchBreakdown, MatchScore, Pill } from '@/components/ui';
import type { ApplicationStatus, MatchAnalysis, OpportunityView } from '@/utils/types';

interface Props {
  opportunity: OpportunityView;
  match: MatchAnalysis | null;
  existing: { status: ApplicationStatus } | null;
  isSignedIn: boolean;
  hasProfile: boolean;
  aiEnabled: boolean;
}

const STATUSES: ApplicationStatus[] = [
  'draft',
  'submitted',
  'pending',
  'reviewed',
  'interviewed',
  'accepted',
  'rejected',
  'withdrawn',
];

export function OpportunityDetail({
  opportunity: o,
  match,
  existing,
  isSignedIn,
  hasProfile,
  aiEnabled,
}: Props) {
  const router = useRouter();
  const [summary, setSummary] = useState(match?.summary ?? '');
  const [source, setSource] = useState(match?.source ?? 'rules');
  const [letter, setLetter] = useState<string | null>(null);
  const [letterMeta, setLetterMeta] = useState<{
    subject: string;
    points: string[];
    tips: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'explain' | 'letter' | null>(null);
  const [pending, startTransition] = useTransition();

  async function explain() {
    setBusy('explain');
    setError(null);
    try {
      const res = await fetch('/api/match/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ opportunityId: o.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not generate analysis.');
      setSummary(body.summary);
      setSource(body.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate analysis.');
    } finally {
      setBusy(null);
    }
  }

  async function generateLetter() {
    setBusy('letter');
    setError(null);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ opportunityId: o.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not generate a letter.');
      setLetter(body.cover_letter);
      setLetterMeta({
        subject: body.subject_line,
        points: body.key_points ?? [],
        tips: body.interview_tips ?? [],
      });
      setSource('ai');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a letter.');
    } finally {
      setBusy(null);
    }
  }

  async function save(patch: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ opportunityId: o.id, ...patch }),
      });
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not save.');
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  const applyHref =
    o.application_method === 'portal' || o.application_method === 'form'
      ? o.application_url
      : o.contact_email
        ? `mailto:${o.contact_email}?subject=${encodeURIComponent(`Application for ${o.title}`)}`
        : null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        {error ? <Alert tone="red">{error}</Alert> : null}

        <section>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="slate">{o.company?.name ?? 'Employer'}</Pill>
            {o.industry ? <Pill tone="brand">{o.industry.name}</Pill> : null}
            {o.company?.verified ? <Pill tone="emerald">Verified</Pill> : null}
            {existing ? <Pill tone="violet">{existing.status}</Pill> : null}
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
            {o.title}
          </h1>

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact label="Location" value={o.location} />
            <Fact
              label="Duration"
              value={o.duration_months ? `${o.duration_months} months` : 'Not stated'}
            />
            <Fact label="Stipend" value={o.stipend ?? 'Not stated'} />
            <Fact
              label="Closes"
              value={o.application_deadline ?? 'Not stated'}
              urgent={Boolean(
                o.application_deadline &&
                  new Date(o.application_deadline).getTime() - Date.now() < 14 * 86_400_000,
              )}
            />
          </dl>
        </section>

        {o.description ? (
          <section>
            <h2 className="text-lg font-bold text-slate-900">About this role</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {o.description}
            </p>
          </section>
        ) : null}

        {o.company?.description ? (
          <section>
            <h2 className="text-lg font-bold text-slate-900">About {o.company.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {o.company.description}
            </p>
          </section>
        ) : null}

        <section>
          <h2 className="text-lg font-bold text-slate-900">Requirements</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <SkillList title="Required" skills={o.requiredSkillNames} tone="emerald" empty="Not specified" />
            <SkillList title="Nice to have" skills={o.preferredSkillNames} tone="slate" empty="Not specified" />
          </div>
          {o.requiredCourseNames.length ? (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold">Open to:</span>{' '}
              {o.requiredCourseNames.join(', ')}
            </p>
          ) : null}
        </section>

        {hasProfile && match ? (
          <section className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Why this score</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Weighted across five factors. Each one is computed from your profile
                  against this specific advert.
                </p>
              </div>
              <MatchScore score={match.overall} verdict={match.verdict} size="lg" />
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-700">
              {summary}
              {source === 'ai' ? (
                <span className="ml-1.5 text-xs text-slate-400">(written by Claude)</span>
              ) : null}
            </p>

            <div className="mt-6">
              <MatchBreakdown components={match.components} />
            </div>

            {match.missingSkills.length ? (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Skills this role wants that are not on your profile
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {match.missingSkills.map((s) => (
                    <Pill key={s} tone="amber">
                      {s}
                    </Pill>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-800">
                  If you actually have these, add them to your profile — it changes the
                  score. If you do not, this is worth learning before applying.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="btn-secondary mt-3 text-xs"
                >
                  Update profile
                </button>
              </div>
            ) : null}

            {aiEnabled ? (
              <button
                type="button"
                onClick={explain}
                disabled={busy !== null}
                className="btn-secondary mt-6"
              >
                {busy === 'explain' ? 'Thinking…' : 'Ask Claude to explain this'}
              </button>
            ) : null}
          </section>
        ) : null}

        {hasProfile ? (
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Cover letter</h2>
            <p className="mt-1 text-sm text-slate-500">
              Generated from your profile and this advert. Edit it — it is a starting
              point, not something to send unread.
            </p>

            {letter ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="label">Subject line</p>
                  <input className="input" readOnly value={letterMeta?.subject ?? ''} />
                </div>
                <div>
                  <p className="label">Letter</p>
                  <textarea
                    className="input min-h-96 font-mono text-xs leading-relaxed"
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                  />
                </div>

                {letterMeta?.points.length ? (
                  <div>
                    <p className="label">Points to emphasise in interview</p>
                    <ul className="space-y-1.5">
                      {letterMeta.points.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {letterMeta?.tips.length ? (
                  <div>
                    <p className="label">Prepare for</p>
                    <ul className="space-y-1.5">
                      {letterMeta.tips.map((t) => (
                        <li key={t} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-brand-500">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => save({ custom_cover_letter: letter, status: 'draft' })}
                    className="btn-primary"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(letter);
                    }}
                    className="btn-secondary"
                  >
                    Copy letter
                  </button>
                  <button
                    type="button"
                    onClick={generateLetter}
                    disabled={busy !== null}
                    className="btn-ghost"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={generateLetter}
                disabled={busy !== null}
                className="btn-primary mt-5"
              >
                {busy === 'letter' ? 'Writing…' : 'Generate cover letter'}
              </button>
            )}
          </section>
        ) : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        {isSignedIn && hasProfile ? (
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">
              {existing ? 'Application' : 'Start an application'}
            </h2>

            {existing ? (
              <>
                <p className="mt-1 text-xs text-slate-500">
                  Currently marked{' '}
                  <span className="font-semibold text-slate-700">{existing.status}</span>.
                </p>
                <label htmlFor="status" className="label mt-4">
                  Update status
                </label>
                <select
                  id="status"
                  className="input"
                  value={existing.status}
                  disabled={pending}
                  onChange={(e) =>
                    save({
                      status: e.target.value,
                      submission_date:
                        e.target.value === 'submitted'
                          ? new Date().toISOString()
                          : undefined,
                    })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Marking an application as submitted here only records it — you still send
                it yourself using the link below.
              </p>
            )}

            <button
              type="button"
              disabled={pending}
              onClick={() =>
                save({
                  status: 'submitted',
                  submission_date: new Date().toISOString(),
                  submission_method: o.application_method,
                  match_score: match?.overall ?? null,
                  match_analysis: match ?? null,
                })
              }
              className="btn-primary mt-4 w-full"
            >
              {existing ? 'Mark as submitted' : 'I have applied'}
            </button>

            {applyHref ? (
              <a
                href={applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full"
              >
                {o.application_method === 'email'
                  ? `Email ${o.contact_email ?? 'the employer'}`
                  : 'Open application page'}
              </a>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                No application link on this listing. Check the company careers page.
              </p>
            )}
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Get a match score</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isSignedIn
                ? 'Complete your profile and this placement gets scored against it.'
                : 'Sign in and complete your profile to see how well this fits you.'}
            </p>
            <Link
              href={isSignedIn ? '/profile' : '/auth/login'}
              className="btn-primary mt-4 w-full"
            >
              {isSignedIn ? 'Complete profile' : 'Sign in'}
            </Link>
          </div>
        )}

        {o.contact_person || o.contact_email ? (
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Contact</h2>
            {o.contact_person ? (
              <p className="mt-2 text-sm text-slate-600">{o.contact_person}</p>
            ) : null}
            {o.contact_email ? (
              <a
                href={`mailto:${o.contact_email}`}
                className="mt-1 block break-all text-sm text-brand-700 hover:underline"
              >
                {o.contact_email}
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Apply well</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Apply within three days of posting. Early beats complete.</li>
            <li>Name the file properly: CV_Name_2027.pdf</li>
            <li>Reference the exact advert title in your email subject.</li>
            <li>Follow up once after seven to ten days, then stop.</li>
            <li>Ask for an attachment confirmation letter for your department.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Fact({
  label,
  value,
  urgent,
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 text-sm font-medium ${urgent ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </dd>
    </div>
  );
}

function SkillList({
  title,
  skills,
  tone,
  empty,
}: {
  title: string;
  skills: string[];
  tone: 'emerald' | 'slate';
  empty: string;
}) {
  return (
    <div>
      <p className="label">{title}</p>
      {skills.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Pill key={s} tone={tone}>
              {s}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}