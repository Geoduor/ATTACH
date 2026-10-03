import { NextResponse } from 'next/server';

import { explainMatch } from '@/utils/ai';
import { badRequest, loadOpportunity, requireProfile, serverError, unavailableWithoutKey } from '@/utils/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const unavailable = unavailableWithoutKey();
    if (unavailable) return unavailable;

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

    const analysis = await explainMatch(guard.profile, loaded.opportunity, loaded.match);

    return NextResponse.json({
      overall: analysis.overall,
      verdict: analysis.verdict,
      summary: analysis.summary,
      source: analysis.source,
    });
  } catch (err) {
    return serverError(err);
  }
}