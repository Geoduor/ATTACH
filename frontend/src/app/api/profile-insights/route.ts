import { NextResponse } from 'next/server';

import { analyzeProfile } from '@/utils/ai';
import { getOpportunities, getSessionUser, getStudentProfile } from '@/utils/data';
import { serverError } from '@/utils/api-helpers';
import type { SessionUser } from '@/utils/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user: SessionUser | null = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    const profile = await getStudentProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { error: 'Complete your student profile first.' },
        { status: 409 },
      );
    }

    // Only the student's own course-aligned listings are worth summarising.
    const all = await getOpportunities();
    const relevant = all
      .filter(
        (o) =>
          o.required_course_ids.includes(profile.course_id) ||
          o.aligned_course_ids.includes(profile.course_id),
      )
      .slice(0, 25);

    const insights = await analyzeProfile(profile, relevant);

    return NextResponse.json(insights);
  } catch (err) {
    return serverError(err);
  }
}