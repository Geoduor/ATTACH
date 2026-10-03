import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { StudentProfileForm } from '@/components/StudentProfileForm';
import { dataMode } from '@/utils/config';
import {
  getCourses,
  getIndustries,
  getSessionUser,
  getSkills,
  getStudentProfile,
  getUniversities,
} from '@/utils/data';

export const metadata: Metadata = { title: 'My profile' };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login?next=/profile');

  const [universities, courses, skills, industries, profile] = await Promise.all([
    getUniversities(),
    getCourses(),
    getSkills(),
    getIndustries(),
    getStudentProfile(user.id),
  ]);

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {profile ? 'Edit your profile' : 'Create your profile'}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          This is what every placement gets scored against. The more accurate it is,
          the more useful your match scores become.
        </p>
      </header>

      {profile ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Programme"
            value={`${profile.course?.name ?? '—'}`}
            sub={`Year ${profile.year_of_study} · ${profile.university?.abbreviation ?? profile.university?.name ?? ''}`}
          />
          <SummaryCard
            label="Skills on profile"
            value={String(profile.skills.length)}
            sub={
              profile.skills.length < 5
                ? 'Add more for better matching'
                : 'Enough signal to score well'
            }
          />
          <SummaryCard
            label="Available"
            value={
              profile.availability_start_date
                ? `${profile.availability_start_date.slice(0, 7)} → ${
                    profile.availability_end_date?.slice(0, 7) ?? '…'
                  }`
                : 'Not set'
            }
            sub={
              profile.preferredLocations.length
                ? profile.preferredLocations.join(', ')
                : 'No location preference'
            }
          />
        </div>
      ) : null}

      <StudentProfileForm
        universities={universities}
        courses={courses}
        skills={skills}
        industries={industries}
        profile={profile}
        demoMode={dataMode === 'demo'}
      />

      {profile ? (
        <p className="mt-6 text-sm text-slate-500">
          Profile updated {profile.updated_at.slice(0, 10)}. Changes apply to your scores
          immediately.{' '}
          <Link href="/opportunities" className="font-semibold text-brand-700 hover:underline">
            See your matches
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-lg font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}