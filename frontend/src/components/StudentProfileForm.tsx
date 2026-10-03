'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type {
  Course,
  Industry,
  OpportunityView,
  Proficiency,
  StudentProfileInput,
  StudentProfileView,
  University,
} from '@/utils/types';

const KENYAN_LOCATIONS = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Nyeri',
  'Machakos',
  'Kiambu',
  'Kakamega',
  'Meru',
  'Kisii',
  'Malindi',
  'Kitale',
  'Naivasha',
];

const STEPS = [
  { n: 1, title: 'Education', hint: 'Where you study and what you study' },
  { n: 2, title: 'Skills', hint: 'What you can actually do' },
  { n: 3, title: 'Preferences', hint: 'Where and when you are available' },
  { n: 4, title: 'Contact', hint: 'How employers reach you' },
] as const;

type FormState = {
  university_id: string;
  course_id: string;
  year_of_study: number;
  expected_graduation_date: string;
  cv_link: string;
  portfolio_link: string;
  bio: string;
  contact_email: string;
  phone_number: string;
  availability_start_date: string;
  availability_end_date: string;
};

const emptyForm = (email: string): FormState => ({
  university_id: '',
  course_id: '',
  year_of_study: 3,
  expected_graduation_date: '',
  cv_link: '',
  portfolio_link: '',
  bio: '',
  contact_email: email,
  phone_number: '',
  availability_start_date: '',
  availability_end_date: '',
});

interface Props {
  universities: University[];
  courses: Course[];
  skills: Array<{ id: string; name: string; category: string }>;
  industries: Industry[];
  profile: StudentProfileView | null;
  /** Present when running on the demo dataset. */
  demoMode: boolean;
}

export function StudentProfileForm({
  universities,
  courses,
  skills,
  industries,
  profile,
  demoMode,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState(profile ? 1 : 1);
  const [form, setForm] = useState<FormState>(() =>
    profile
      ? {
          university_id: profile.university_id,
          course_id: profile.course_id,
          year_of_study: profile.year_of_study,
          expected_graduation_date: profile.expected_graduation_date ?? '',
          cv_link: profile.cv_link ?? '',
          portfolio_link: profile.portfolio_link ?? '',
          bio: profile.bio ?? '',
          contact_email: profile.contact_email,
          phone_number: profile.phone_number ?? '',
          availability_start_date: profile.availability_start_date ?? '',
          availability_end_date: profile.availability_end_date ?? '',
        }
      : emptyForm(''),
  );

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.skills.map((s) => s.id) ?? [],
  );
  const [proficiency, setProficiency] = useState<Proficiency>('intermediate');
  const [locations, setLocations] = useState<string[]>(profile?.preferredLocations ?? []);
  const [industryIds, setIndustryIds] = useState<string[]>(
    profile?.preferredIndustries.map((i) => i.id) ?? [],
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof FormState) => (value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  function toggle(list: string[], value: string, apply: (next: string[]) => void) {
    apply(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function validate(current: number): string | null {
    if (current === 1) {
      if (!form.university_id) return 'Select your university.';
      if (!form.course_id) return 'Select your course.';
      if (!form.expected_graduation_date) return 'Add your expected graduation date.';
    }
    if (current === 2 && selectedSkills.length === 0) {
      return 'Select at least one skill. Three or more gets you noticeably better matches.';
    }
    if (current === 3) {
      if (!form.availability_start_date || !form.availability_end_date) {
        return 'Add the window you are available for.';
      }
      if (form.availability_end_date < form.availability_start_date) {
        return 'Your end date is before your start date.';
      }
    }
    if (current === 4 && !form.contact_email) return 'Add a contact email.';
    return null;
  }

  function next() {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate(4) ?? validate(3) ?? validate(2) ?? validate(1);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);

    const payload: StudentProfileInput = {
      university_id: form.university_id,
      course_id: form.course_id,
      year_of_study: form.year_of_study,
      expected_graduation_date: form.expected_graduation_date || null,
      bio: form.bio || null,
      portfolio_link: form.portfolio_link || null,
      cv_link: form.cv_link || null,
      contact_email: form.contact_email,
      phone_number: form.phone_number || null,
      availability_start_date: form.availability_start_date || null,
      availability_end_date: form.availability_end_date || null,
      skill_ids: selectedSkills,
      proficiency,
      preferred_locations: locations,
      preferred_industry_ids: industryIds,
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not save your profile.');

      startTransition(() => {
        router.refresh();
        router.push('/dashboard');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    }
  }

  const grouped = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const universityCourses = courses.filter(
    (c) => !form.university_id || c.university_id === form.university_id,
  );

  return (
    <form onSubmit={submit} className="card overflow-hidden">
      <ol className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
        {STEPS.map((s) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <li key={s.n} className="border-r border-slate-200 last:border-r-0">
              <button
                type="button"
                onClick={() => (s.n < step ? setStep(s.n) : next())}
                className={`flex w-full flex-col items-center gap-0.5 px-2 py-3 text-center transition ${
                  active ? 'bg-white' : ''
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {done ? '✓' : s.n}
                </span>
                <span
                  className={`text-xs font-medium ${
                    active ? 'text-brand-700' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-6 sm:p-8">
        {error ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <fieldset className="space-y-5">
            <StepHeading
              title="Education"
              hint="Your course is the heaviest factor in every match score, so this needs to be right."
            />

            <Field label="University" htmlFor="university_id" required>
              <select
                id="university_id"
                className="input"
                value={form.university_id}
                onChange={(e) => {
                  set('university_id')(e.target.value);
                  set('course_id')('');
                }}
                required
              >
                <option value="">Select your university</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.abbreviation ? ` (${u.abbreviation})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Course / programme"
              htmlFor="course_id"
              required
              hint={form.university_id ? undefined : 'Pick a university first.'}
            >
              <select
                id="course_id"
                className="input"
                value={form.course_id}
                onChange={(e) => set('course_id')(e.target.value)}
                disabled={!form.university_id}
                required
              >
                <option value="">Select your course</option>
                {universityCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.code ? ` (${c.code})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Year of study" htmlFor="year_of_study" required>
                <select
                  id="year_of_study"
                  className="input"
                  value={form.year_of_study}
                  onChange={(e) => set('year_of_study')(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expected graduation" htmlFor="graduation" required>
                <input
                  id="graduation"
                  type="date"
                  className="input"
                  value={form.expected_graduation_date}
                  onChange={(e) => set('expected_graduation_date')(e.target.value)}
                  required
                />
              </Field>
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="space-y-5">
            <StepHeading
              title="Skills"
              hint="Tick everything you can defend in an interview. Three is the minimum; eight or more gives the matcher real signal."
            />

            {Object.entries(grouped).map(([category, list]) => (
              <div key={category}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => {
                    const on = selectedSkills.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(selectedSkills, s.id, setSelectedSkills)}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          on
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Field
              label="Overall proficiency"
              htmlFor="proficiency"
              hint="Used to calibrate how confidently your skills are claimed."
            >
              <select
                id="proficiency"
                className="input max-w-xs"
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value as Proficiency)}
              >
                <option value="beginner">Beginner — coursework only</option>
                <option value="intermediate">Intermediate — built projects</option>
                <option value="advanced">Advanced — shipped or led work</option>
                <option value="expert">Expert — could mentor others</option>
              </select>
            </Field>

            <Field
              label="Short bio"
              htmlFor="bio"
              hint="Optional, but it is fed into the cover letter generator."
            >
              <textarea
                id="bio"
                rows={4}
                className="input"
                placeholder="What are you interested in working on? Any projects, clubs or previous attachments?"
                value={form.bio}
                onChange={(e) => set('bio')(e.target.value)}
              />
            </Field>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <fieldset className="space-y-6">
            <StepHeading
              title="Availability and preferences"
              hint="These two answers decide whether you see the Eastleigh roles or the Mombasa ones."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Available from" htmlFor="avail_start" required>
                <input
                  id="avail_start"
                  type="date"
                  className="input"
                  value={form.availability_start_date}
                  onChange={(e) => set('availability_start_date')(e.target.value)}
                  required
                />
              </Field>
              <Field label="Available until" htmlFor="avail_end" required>
                <input
                  id="avail_end"
                  type="date"
                  className="input"
                  value={form.availability_end_date}
                  onChange={(e) => set('availability_end_date')(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div>
              <p className="label">
                Preferred locations
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  {locations.length ? `(${locations.length} selected)` : 'optional'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {KENYAN_LOCATIONS.map((loc) => {
                  const on = locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggle(locations, loc, setLocations)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        on
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="label">
                Preferred industries
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  optional
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => {
                  const on = industryIds.includes(ind.id);
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => toggle(industryIds, ind.id, setIndustryIds)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        on
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
                      }`}
                    >
                      {ind.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>
        ) : null}

        {step === 4 ? (
          <fieldset className="space-y-5">
            <StepHeading
              title="Contact details and links"
              hint="The CV link goes on every application. Use a public Drive or Dropbox link, not an attachment."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Contact email" htmlFor="email" required>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email')(e.target.value)}
                  required
                />
              </Field>
              <Field label="Phone (WhatsApp)" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  placeholder="+2547…"
                  value={form.phone_number}
                  onChange={(e) => set('phone_number')(e.target.value)}
                />
              </Field>
            </div>

            <Field label="CV / resume link" htmlFor="cv" required>
              <input
                id="cv"
                type="url"
                className="input"
                placeholder="https://drive.google.com/…"
                value={form.cv_link}
                onChange={(e) => set('cv_link')(e.target.value)}
                required
              />
            </Field>

            <Field label="Portfolio / GitHub" htmlFor="portfolio">
              <input
                id="portfolio"
                type="url"
                className="input"
                placeholder="https://github.com/you"
                value={form.portfolio_link}
                onChange={(e) => set('portfolio_link')(e.target.value)}
              />
            </Field>

            {demoMode ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Running on the demo dataset, so your profile lives in server memory and
                resets when you restart the dev server. Connect Supabase to make it
                permanent.
              </p>
            ) : null}
          </fieldset>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="btn-secondary"
        >
          Back
        </button>

        {step < 4 ? (
          <button type="button" onClick={next} className="btn-primary">
            Continue
          </button>
        ) : (
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Saving…' : profile ? 'Save changes' : 'Create profile'}
          </button>
        )}
      </div>
    </form>
  );
}

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}