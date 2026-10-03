import { NextResponse } from 'next/server';

import { badRequest, serverError } from '@/utils/api-helpers';
import { getSessionUser, saveStudentProfile } from '@/utils/data';
import type { Proficiency, StudentProfileInput } from '@/utils/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROFICIENCIES: Proficiency[] = ['beginner', 'intermediate', 'advanced', 'expert'];

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strOrNull = (v: unknown): string | null => {
  const s = str(v);
  return s.length ? s : null;
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest('Expected a JSON body.');
    }

    const universityId = str(body.university_id);
    const courseId = str(body.course_id);
    const email = str(body.contact_email);
    const year = Number(body.year_of_study);

    if (!universityId || !courseId) {
      return badRequest('University and course are required.');
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return badRequest('A valid contact email is required.');
    }
    if (!Number.isInteger(year) || year < 1 || year > 5) {
      return badRequest('Year of study must be between 1 and 5.');
    }

    const skillIds = Array.isArray(body.skill_ids)
      ? body.skill_ids.filter((v): v is string => typeof v === 'string')
      : [];
    if (skillIds.length === 0) {
      return badRequest('Select at least one skill.');
    }

    const locations = Array.isArray(body.preferred_locations)
      ? body.preferred_locations
          .filter((v): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
    const industryIds = Array.isArray(body.preferred_industry_ids)
      ? body.preferred_industry_ids.filter(
          (v): v is string => typeof v === 'string',
        )
      : [];

    const start = strOrNull(body.availability_start_date);
    const end = strOrNull(body.availability_end_date);
    if (start && end && end < start) {
      return badRequest('Availability end date must be on or after the start date.');
    }

    const input: StudentProfileInput = {
      university_id: universityId,
      course_id: courseId,
      year_of_study: year,
      expected_graduation_date: strOrNull(body.expected_graduation_date),
      bio: strOrNull(body.bio),
      portfolio_link: strOrNull(body.portfolio_link),
      cv_link: strOrNull(body.cv_link),
      contact_email: email,
      phone_number: strOrNull(body.phone_number),
      availability_start_date: start,
      availability_end_date: end,
      skill_ids: skillIds,
      proficiency: PROFICIENCIES.includes(body.proficiency as Proficiency)
        ? (body.proficiency as Proficiency)
        : 'intermediate',
      preferred_locations: locations,
      preferred_industry_ids: industryIds,
    };

    const saved = await saveStudentProfile(user.id, input);

    return NextResponse.json({
      ok: true,
      profile: {
        id: saved.id,
        course: saved.course?.name ?? null,
        university: saved.university?.name ?? null,
        skillCount: saved.skills.length,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}