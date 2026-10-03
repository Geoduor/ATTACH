import { NextResponse } from 'next/server';

import { badRequest, serverError } from '@/utils/api-helpers';
import {
  addApplicationNote,
  getApplications,
  getSessionUser,
  getStudentProfile,
} from '@/utils/data';
import type { ApplicationNote } from '@/utils/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTE_TYPES: ApplicationNote['note_type'][] = [
  'general',
  'update',
  'interview',
  'follow_up',
  'rejection',
];

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    const profile = await getStudentProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'No profile found.' }, { status: 409 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest('Expected a JSON body.');
    }

    const applicationId =
      typeof body.applicationId === 'string' ? body.applicationId.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!applicationId) return badRequest('Missing applicationId.');
    if (!note) return badRequest('Note text is required.');
    if (note.length > 4000) return badRequest('Note is too long (4000 character limit).');

    const noteType = NOTE_TYPES.includes(body.noteType as ApplicationNote['note_type'])
      ? (body.noteType as ApplicationNote['note_type'])
      : 'general';

    const mine = await getApplications(profile.id);
    if (!mine.some((a) => a.id === applicationId)) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const created = await addApplicationNote(profile.id, applicationId, note, noteType);
    return NextResponse.json({ ok: true, note: created });
  } catch (err) {
    return serverError(err);
  }
}