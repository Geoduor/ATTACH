import { NextResponse } from 'next/server';

import { badRequest, serverError } from '@/utils/api-helpers';
import { deleteApplication, getSessionUser, getStudentProfile, saveApplication } from '@/utils/data';
import type { Application, ApplicationStatus } from '@/utils/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

/**
 * POST   → create or update the application for an opportunity.
 * DELETE → remove it (and its notes, via ON DELETE CASCADE).
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest('Expected a JSON body.');
    }

    const opportunityId =
      typeof body.opportunityId === 'string' ? body.opportunityId.trim() : '';
    if (!opportunityId) return badRequest('Missing opportunityId.');

    // The placement must exist before we record anything against it. This check
    // used to live inside the `match_score` branch, which meant a plain
    // { opportunityId, status } POST happily created an orphan row.
    const { buildMatchContext, getOpportunity } = await import('@/utils/data');
    const { matchOpportunity } = await import('@/utils/matching');

    const opportunity = await getOpportunity(opportunityId);
    if (!opportunity) {
      return NextResponse.json({ error: 'Placement not found.' }, { status: 404 });
    }

    const changes: Partial<Application> = {};

    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !STATUSES.includes(body.status as ApplicationStatus)) {
        return badRequest(`status must be one of: ${STATUSES.join(', ')}`);
      }
      changes.status = body.status as ApplicationStatus;
    }

    if (body.custom_cover_letter !== undefined) {
      changes.custom_cover_letter =
        typeof body.custom_cover_letter === 'string' ? body.custom_cover_letter : null;
    }

    if (body.generated_cover_letter !== undefined) {
      changes.generated_cover_letter =
        typeof body.generated_cover_letter === 'string'
          ? body.generated_cover_letter
          : null;
    }

    if (body.notes !== undefined) {
      changes.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
    }

    if (body.submission_method !== undefined) {
      changes.submission_method =
        typeof body.submission_method === 'string' ? body.submission_method : null;
    }

    // Match data is always recomputed server-side and never trusted from the
    // client, so a stored score can never disagree with the current profile.
    const match = matchOpportunity(profile, opportunity, await buildMatchContext());
    changes.match_score = match.overall;
    changes.match_analysis = match;

    if (changes.status === 'submitted' && !changes.submission_date) {
      changes.submission_date = new Date().toISOString();
    }

    const saved = await saveApplication(profile.id, opportunityId, changes);

    return NextResponse.json({ ok: true, application: saved });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    const profile = await getStudentProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'No profile found.' }, { status: 409 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return badRequest('Missing application id.');

    const { getApplications } = await import('@/utils/data');
    const mine = await getApplications(profile.id);
    const target = mine.find((a) => a.id === id);

    // Ownership check: the ID alone is not authorisation.
    if (!target) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    await deleteApplication(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}