import type { Metadata } from 'next';

import { aiMode, dataMode, hasSupabase } from '@/utils/config';

export const metadata: Metadata = { title: 'How matching works' };

const WEIGHTS = [
  ['Course alignment', 35, 'Is your programme explicitly required, listed as aligned, or in the same department?'],
  ['Skills match', 30, 'Share of required skills you have (78% of the weight), plus preferred skills (22%).'],
  ['Industry fit', 15, 'How well the employer\'s sector maps onto your programme, boosted if you named it a preference.'],
  ['Location', 10, 'Your preferred areas, with same-region credit and partial credit for "multiple locations".'],
  ['Duration', 10, 'Whether your availability window is long enough to cover the placement.'],
] as const;

export default function HowItWorksPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-slate-900">How matching works</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Every placement gets a score out of 100. The score is calculated from your profile
        and that specific advert, and it comes with a breakdown of where each point came
        from. If a score looks wrong, you can see exactly why.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">The five factors</h2>
        <div className="mt-4 space-y-3">
          {WEIGHTS.map(([label, weight, detail]) => (
            <div key={label} className="card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{label}</h3>
                <span className="text-sm font-bold tabular-nums text-brand-700">
                  {weight}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${weight * 2.2}%` }}
                />
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Course and skills carry two thirds of the score on purpose. They are what
          determines whether you can actually do the work. Location and duration matter
          less — a strong student often has more options on where and when.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">What the AI does, and does not do</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Deterministic, not generated</h3>
            <p className="mt-2">
              Scores are computed arithmetically, not by a language model. That means a
              score does not change between page loads, two students with identical
              profiles get identical scores, and no API call is needed to rank anything.
              A model-generated score would be non-reproducible and impossible to argue
              with when it is wrong.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Claude writes, it does not score</h3>
            <p className="mt-2">
              {aiMode === 'claude'
                ? 'Anthropic API key detected, so Claude writes the written analysis, the profile insights and the cover letters. The numeric scores above still come from the deterministic engine, and Claude is instructed never to contradict them.'
                : 'No Anthropic API key is set, so written analysis, profile insights and cover letters use built-in templates instead. Add ANTHROPIC_API_KEY to .env.local to turn Claude on. The scoring engine does not change either way.'}
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Letters are drafts</h3>
            <p className="mt-2">
              Generated letters are a starting point. They are grounded in your profile
              and the advert, but you should read them, correct anything inaccurate, and
              make them sound like you before sending. Sending an unreviewed AI letter is
              obvious to recruiters.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Where your data goes</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {hasSupabase
            ? 'Your profile, skills and application history are stored in your own Supabase database. Row-level security policies mean each student can only read and write their own rows — verified at the database level, not in application code.'
            : 'You are on the demo dataset. Your profile lives in server memory and disappears when the dev server restarts. Nothing is written to disk and no credentials are in use.'}
          {aiMode === 'claude'
            ? ' When you generate a letter or ask for an analysis, the relevant parts of your profile and the advert text are sent to the Anthropic API. That is the only time your data leaves the system.'
            : ' No data is sent anywhere external, because no AI calls are being made.'}
        </p>
      </section>

      <section className="mt-12 rounded-xl bg-slate-900 p-8 text-slate-300">
        <h2 className="text-lg font-bold text-white">Current configuration</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Data source</dt>
            <dd className="mt-0.5 font-medium text-white">
              {dataMode === 'supabase' ? 'Supabase (live)' : 'In-memory demo dataset'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">AI provider</dt>
            <dd className="mt-0.5 font-medium text-white">
              {aiMode === 'claude' ? 'Claude API (live)' : 'Built-in templates'}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs text-slate-500">
          Both settings are controlled entirely by your .env.local file. See the project
          README for how to switch each one on.
        </p>
      </section>
    </div>
  );
}