import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OpportunityDetail } from '@/components/OpportunityDetail';
import { EmptyState } from '@/components/ui';
import { hasClaude } from '@/utils/config';
import {
  buildMatchContext,
  daysUntil,
  getApplicationForOpportunity,
  getOpportunity,
  getSessionUser,
  getStudentProfile,
} from '@/utils/data';
import { matchOpportunity } from '@/utils/matching';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return { title: 'Placement not found' };

  return {
    title: opportunity.title,
    description:
      opportunity.description?.slice(0, 155) ??
      `${opportunity.title} at ${opportunity.company?.name ?? 'an employer'}`,
  };
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="That placement is no longer available"
          description="It may have been filled, or the deadline has passed. Have a look at what is still open."
          action={
            <Link href="/opportunities" className="btn-primary mt-2">
              Browse open placements
            </Link>
          }
        />
      </div>
    );
  }

  const user = await getSessionUser();
  const profile = user ? await getStudentProfile(user.id) : null;

  const match = profile
    ? matchOpportunity(profile, opportunity, await buildMatchContext())
    : null;

  const existing = profile
    ? await getApplicationForOpportunity(profile.id, opportunity.id)
    : null;

  const days = daysUntil(opportunity.application_deadline);

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm">
        <Link href="/opportunities" className="text-slate-500 hover:text-slate-900">
          Open placements
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">{opportunity.company?.name}</span>
      </nav>

      <OpportunityDetail
        opportunity={opportunity}
        match={match}
        existing={existing ? { status: existing.status } : null}
        isSignedIn={!!user}
        hasProfile={!!profile}
        aiEnabled={hasClaude}
      />

      {days !== null && days <= 7 ? (
        <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This listing closes in {days} day{days === 1 ? '' : 's'}. Applications sent after
          the deadline are usually not read.
        </p>
      ) : null}
    </div>
  );
}