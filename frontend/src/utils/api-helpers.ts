/**
 * Shared helpers for AI route handlers.
 *
 * Every route re-checks the session server-side. A client component can only
 * ask; it cannot authorise itself. This is also where the profile gate lives,
 * so no route can be used to burn Claude tokens without a real profile.
 */

import { NextResponse } from 'next/server';

import { hasClaude } from './config';
import {
  buildMatchContext,
  getOpportunity,
  getSessionUser,
  getStudentProfile,
} from './data';
import { matchOpportunity, type MatchContext } from './matching';
import type { MatchAnalysis, OpportunityView, StudentProfileView } from './types';

type Guard =
  | { ok: true; userId: string; profile: StudentProfileView }
  | { ok: false; response: NextResponse };

export async function requireProfile(): Promise<Guard> {
  const user = await getSessionUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sign in to use this feature.' },
        { status: 401 },
      ),
    };
  }

  const profile = await getStudentProfile(user.id);

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Complete your student profile first.' },
        { status: 409 },
      ),
    };
  }

  return { ok: true, userId: user.id, profile };
}

export async function loadOpportunity(
  id: unknown,
): Promise<{ ok: true; opportunity: OpportunityView; match: MatchAnalysis } | { ok: false; response: NextResponse }> {
  if (typeof id !== 'string' || !id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing opportunityId.' }, { status: 400 }),
    };
  }

  const guard = await requireProfile();
  if (!guard.ok) return guard;

  const opportunity = await getOpportunity(id);
  if (!opportunity) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Placement not found.' }, { status: 404 }),
    };
  }

  const match = matchOpportunity(guard.profile, opportunity, await buildMatchContext());

  return { ok: true, opportunity, match };
}

export function unavailableWithoutKey(): NextResponse | null {
  if (hasClaude) return null;
  return NextResponse.json(
    {
      error:
        'No ANTHROPIC_API_KEY is set on the server, so this AI feature is unavailable. Rule-based scoring still works everywhere.',
    },
    { status: 503 },
  );
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  console.error('[api]', message);
  return NextResponse.json(
    { error: 'Something went wrong on our side. Please try again.' },
    { status: 500 },
  );
}

export type { MatchContext };