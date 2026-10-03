import { NextResponse } from 'next/server';

import { generateCoverLetter } from '@/utils/ai';
import { badRequest, loadOpportunity, serverError, requireProfile } from '@/utils/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const guard = await requireProfile();
    if (!guard.ok) return guard.response;

    let body: { opportunityId?: unknown };
    try {
      body = await request.json();
    } catch {
      return badRequest('Expected a JSON body.');
    }

    const loaded = await loadOpportunity(body.opportunityId);
    if (!loaded.ok) return loaded.response;

    // generateCoverLetter falls back to a template when no key is set, so this
    // route stays useful either way — the response tells the UI which it was.
    const result = await generateCoverLetter(guard.profile, loaded.opportunity);

    return NextResponse.json(result);
  } catch (err) {
    return serverError(err);
  }
}