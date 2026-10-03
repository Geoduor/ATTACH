# AttachKenya — Attachment Placement Agent

AI-assisted matching between Kenyan university students and industrial attachment / internship
opportunities, built from the original design brief.

Students build a profile once; every placement in the database is then scored against it with a
transparent 0–100 breakdown, so they apply to roles that actually fit their course instead of
whatever advert came up first.

---

## Quick start

No accounts, no API keys, no database required.

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000> and click **Continue as demo student**.

The demo student is pre-loaded (3rd-year Accounting & Finance at the Technical University of
Kenya) and scores against 36 seeded placements, so you land on a working dashboard with real match
scores instead of an empty state.

| Script              | Purpose                        |
| ------------------- | ------------------------------ |
| `npm run dev`       | Dev server on port 3000        |
| `npm run build`     | Production build               |
| `npm start`         | Serve the production build     |
| `npm run typecheck` | `tsc --noEmit`                 |
| `npm run lint`      | ESLint via `next lint`         |

---

## How it degrades without credentials

The app boots in one of two modes per concern, chosen at runtime by what is present in the
environment. Adding a credential upgrades the same code path — there is no separate demo build.

| Concern  | With credentials                    | Without credentials                      |
| -------- | ----------------------------------- | ---------------------------------------- |
| Data     | Supabase (Postgres, RLS enforced)   | In-process demo dataset, 37 companies / 37 placements / 12 industries |
| Auth     | Supabase Auth (email + password)    | `POST /auth/demo` in-memory session      |
| Scoring  | Deterministic (always)              | Deterministic (always)                   |
| Writing  | Claude writes the letter            | Template letter generator                |

The footer of every page shows the active mode (`Data: Demo dataset`, `AI: Rule-based`), so you
always know which side you are on.

### Why scoring is deterministic, not LLM-generated

Match scores come from a weighted rules engine, not from Claude. The original design called the
model once per opportunity, sequentially, for every student — slow, non-reproducible, and
impossible to explain to a student who asks "why is this an 84?".

The engine scores five components and shows its working:

| Component | Weight | What it measures                                              |
| --------- | ------ | ------------------------------------------------------------- |
| Course    | 35%    | Exact course, same course at another university, same department (60), else baseline 25 |
| Skills    | 30%    | Required + preferred skills the student has listed             |
| Industry  | 15%    | Student industry preferences, weighted by course/industry alignment |
| Location  | 10%    | Preference-order aware — 1st choice scores above 2nd           |
| Duration  | 10%    | Whether the attachment length fits the stated availability    |

Claude is used only where it genuinely adds value: writing narrative prose (cover letters, match
explanations, profile insights). Those calls all live server-side in `/api/*` route handlers.

---

## Connecting Supabase

1. Create a project at <https://supabase.com>.
2. Open the **SQL Editor** and run, in this order:
   - `database/01-schema.sql` — 15 tables, indexes, triggers, and RLS policies
   - `database/02-seed.sql` — reference data and 37 sample opportunities (idempotent, safe to re-run)
3. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only, admin analytics
```

Restart the dev server. The footer switches to `Data: Supabase`.

The `handle_new_user` auth trigger creates a `student_profiles` row on signup, so the profile form
has something to update from the first visit.

## Connecting Claude

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5
```

The footer switches to `AI: Claude`. `ANTHROPIC_MODEL` is read at runtime, so you can pin a
different model without a code change.

The key is only ever read in server-only modules (`src/utils/ai.ts` imports `server-only`), and is
never referenced from a client component.

---

## The four agents

| Agent                | Where it lives                              | Behaviour |
| -------------------- | ------------------------------------------- | --------- |
| Profile Analyzer     | `src/components/StudentProfileForm.tsx`, `src/utils/data.ts` | 4-step form; normalises skills, builds a completeness score |
| Opportunity Matcher  | `src/utils/matching.ts`                     | Deterministic 5-component weighted scoring, runs across all placements |
| Application Generator| `src/utils/ai.ts` → `POST /api/cover-letter`| Letter + interview talking points; falls back to a template |
| Application Tracker  | `src/components/ApplicationsList.tsx`       | Status pipeline (`draft` → `submitted` → … → `accepted`/`rejected`) with a dated timeline of notes |

---

## Project layout

```
database/
  01-schema.sql        15 tables, RLS policies, auth trigger, indexes
  02-seed.sql          universities, industries, courses, skills, companies, opportunities
frontend/
  src/app/             App Router pages and /api route handlers
  src/components/      Navbar, forms, opportunity cards, application tracker
  src/utils/
    config.ts          runtime mode detection
    data.ts            server-only data layer (Supabase or demo)
    demo-data.ts       in-process dataset + seeded demo student
    matching.ts        deterministic scoring engine
    ai.ts              server-only Claude calls + template fallbacks
    types.ts           domain types
  src/middleware.ts    page guards (API routes self-check)
```

---

## Notes for whoever picks this up

- **Demo state is in-memory.** Restarting the dev server resets the demo student's applications and
  notes. The dataset itself is regenerated on boot, so nothing needs cleaning up.
- **Middleware guards pages, not API routes.** Each `/api/*` handler re-checks the session itself,
  so the API is never reachable by relying on the middleware alone.
- **Expired placements are hidden.** `getOpportunities()` drops any placement whose
  `application_deadline` has passed, so stale adverts never surface.
- **Match scores are recomputed server-side on every write.** `POST /api/applications` ignores any
  client-supplied score and recalculates, so a stored score can never drift from the current profile.
- **The seed data is idempotent.** Re-running `02-seed.sql` refreshes records rather than duplicating
  them, which makes it safe to run after schema changes.