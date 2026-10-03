'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { MatchScore, Pill } from '@/components/ui';
import type { ApplicationNote, ApplicationStatus, ApplicationView } from '@/utils/types';

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

const STATUS_TONE: Record<ApplicationStatus, 'slate' | 'brand' | 'emerald' | 'amber' | 'red' | 'violet'> = {
  draft: 'slate',
  submitted: 'brand',
  pending: 'amber',
  reviewed: 'violet',
  interviewed: 'violet',
  accepted: 'emerald',
  rejected: 'red',
  withdrawn: 'slate',
};

export function ApplicationsList({
  applications,
}: {
  applications: ApplicationView[];
}) {
  return (
    <ul className="space-y-4">
      {applications.map((a) => (
        <ApplicationRow key={a.id} application={a} />
      ))}
    </ul>
  );
}

function ApplicationRow({ application: a }: { application: ApplicationView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState<ApplicationNote['note_type']>('general');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function patch(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ opportunityId: a.opportunity_id, ...body }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Could not save.');
      return;
    }
    startTransition(() => router.refresh());
  }

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setError(null);

    const res = await fetch('/api/application-notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ applicationId: a.id, note, noteType }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Could not add note.');
      return;
    }

    setNote('');
    startTransition(() => router.refresh());
  }

  async function remove() {
    if (!confirm('Remove this application and its notes? This cannot be undone.')) return;

    setError(null);
    const res = await fetch(`/api/applications?id=${a.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? 'Could not remove.');
      return;
    }
    startTransition(() => router.refresh());
  }

  const submitted = a.submission_date ? new Date(a.submission_date) : null;
  const daysWaiting = submitted
    ? Math.floor((Date.now() - submitted.getTime()) / 86_400_000)
    : null;

  return (
    <li className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
            {a.opportunity?.company?.name ? (
              <Pill tone="slate">{a.opportunity.company.name}</Pill>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {a.opportunity?.title ?? 'Placement removed'}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {a.opportunity
              ? `${a.opportunity.location} · ${a.opportunity.duration_months ?? '—'} months`
              : 'The listing this pointed to is no longer active.'}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            {a.submission_date ? (
              <span>
                Sent {a.submission_date.slice(0, 10)}
                {daysWaiting !== null ? ` · ${daysWaiting} days ago` : ''}
              </span>
            ) : (
              <span>Not marked as sent</span>
            )}
            {a.timeline.length ? (
              <span>
                {a.timeline.length}{' '}
                {a.timeline.length === 1 ? 'entry' : 'entries'} logged
              </span>
            ) : null}
          </div>
        </div>

        {a.match_score != null ? (
          <MatchScore score={a.match_score} size="sm" />
        ) : null}
      </div>

      {error ? (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2.5 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
        <label htmlFor={`status-${a.id}`} className="text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          id={`status-${a.id}`}
          className="input max-w-[9rem] py-1 text-xs"
          value={a.status}
          disabled={pending}
          onChange={(e) => patch({ status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost ml-auto text-xs"
        >
          {open ? 'Hide details' : 'Notes & letter'}
        </button>

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="btn-danger px-3 py-1 text-xs"
        >
          Remove
        </button>
      </div>

      {open ? (
        <div className="space-y-5 border-t border-slate-100 p-5">
          {a.match_analysis ? (
            <div>
              <p className="label">Match analysis at time of applying</p>
              <p className="text-sm leading-relaxed text-slate-600">
                {a.match_analysis.summary}
              </p>
            </div>
          ) : null}

          {a.custom_cover_letter ?? a.generated_cover_letter ? (
            <div>
              <p className="label">Your letter</p>
              <textarea
                className="input min-h-64 font-mono text-xs leading-relaxed"
                defaultValue={a.custom_cover_letter ?? a.generated_cover_letter ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (a.custom_cover_letter ?? '')) {
                    patch({ custom_cover_letter: e.target.value });
                  }
                }}
              />
              <p className="mt-1 text-xs text-slate-400">
                Changes save when you click outside the box.
              </p>
            </div>
          ) : null}

          <div>
            <p className="label">Timeline</p>
            {a.timeline.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nothing logged yet. Record calls, emails and interview dates here.
              </p>
            ) : (
              <ol className="space-y-2.5">
                {a.timeline.map((n) => (
                  <li key={n.id} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs tabular-nums text-slate-400">
                      {n.created_at.slice(0, 10)}
                    </span>
                    <span className="min-w-0">
                      <Pill tone="slate">{n.note_type}</Pill>
                      <p className="mt-1 text-slate-600">{n.note}</p>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <form onSubmit={submitNote} className="mt-4 flex flex-wrap gap-2">
              <select
                className="input max-w-[9rem] py-1.5 text-xs"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as ApplicationNote['note_type'])}
                aria-label="Note type"
              >
                <option value="general">general</option>
                <option value="update">update</option>
                <option value="interview">interview</option>
                <option value="follow_up">follow-up</option>
                <option value="rejection">rejection</option>
              </select>
              <input
                className="input flex-1 min-w-[12rem] py-1.5 text-xs"
                placeholder="Called HR, asked about team structure…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button type="submit" className="btn-secondary py-1.5 text-xs">
                Add
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </li>
  );
}