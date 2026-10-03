/**
 * Data access layer.
 *
 * Every read/write goes through here. It returns the same shapes whether the
 * backing store is Supabase or the in-process demo dataset, so pages and API
 * routes never branch on which mode is active.
 *
 * SERVER ONLY — supabase.ts reads cookies().
 */

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { dataMode } from './config';
import {
  demoCompanies,
  demoCourses,
  demoIndustries,
  demoOpportunities,
  demoSkills,
  demoStore,
  demoUniversities,
  demoAlignments,
  nextDemoId,
  nowIso,
} from './demo-data';
import { matchOpportunity, type MatchContext } from './matching';
import { createServerSupabaseClient } from './supabase';
import type {
  Application,
  ApplicationNote,
  ApplicationView,
  Company,
  Course,
  Industry,
  Opportunity,
  OpportunityView,
  Skill,
  StudentProfile,
  StudentProfileInput,
  StudentProfileView,
  University,
} from './types';

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoStore().sessions.get('demo') ?? null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Student',
  };
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

async function fetchAll<T>(supabase: SupabaseClient, table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function getUniversities(): Promise<University[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoUniversities;
  return fetchAll<University>(supabase, 'universities');
}

export async function getCourses(universityId?: string): Promise<Course[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return universityId
      ? demoCourses.filter((c) => c.university_id === universityId)
      : demoCourses;
  }
  let query = supabase.from('courses').select('*').order('name');
  if (universityId) query = query.eq('university_id', universityId);
  const { data, error } = await query;
  if (error) throw new Error(`courses: ${error.message}`);
  return (data ?? []) as Course[];
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoSkills;
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw new Error(`skills: ${error.message}`);
  return (data ?? []) as Skill[];
}

export async function getIndustries(): Promise<Industry[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoIndustries;
  return fetchAll<Industry>(supabase, 'industries');
}

async function loadCompanies(): Promise<Company[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoCompanies;
  return fetchAll<Company>(supabase, 'companies');
}

async function loadIndustries(): Promise<Industry[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoIndustries;
  return fetchAll<Industry>(supabase, 'industries');
}

async function loadOpportunityIndustries(): Promise<Map<string, string[]>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return new Map(
      demoOpportunities.map((o) => [o.id, [demoCompanies.find((c) => c.id === o.company_id)?.industry_id ?? ''].filter(Boolean)]),
    );
  }
  const rows = await fetchAll<{ opportunity_id: string; industry_id: string }>(
    supabase,
    'opportunity_industries',
  );
  const map = new Map<string, string[]>();
  for (const r of rows) {
    map.set(r.opportunity_id, [...(map.get(r.opportunity_id) ?? []), r.industry_id]);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

function decorate(
  opp: Opportunity,
  companies: Company[],
  industries: Industry[],
  skills: Skill[],
  courses: Course[],
  oppIndustries: Map<string, string[]>,
): OpportunityView {
  const skillNames = (ids: string[]) =>
    ids.map((id) => skills.find((s) => s.id === id)?.name).filter(Boolean) as string[];
  const courseNames = (ids: string[]) =>
    ids.map((id) => courses.find((c) => c.id === id)?.name).filter(Boolean) as string[];

  const company = companies.find((c) => c.id === opp.company_id) ?? null;
  const industryIds = oppIndustries.get(opp.id) ?? [];
  const industry =
    industries.find((i) => i.id === company?.industry_id) ??
    industries.find((i) => industryIds.includes(i.id)) ??
    null;

  return {
    ...opp,
    company,
    industry,
    requiredSkillNames: skillNames(opp.required_skills ?? []),
    preferredSkillNames: skillNames(opp.preferred_skills ?? []),
    requiredCourseNames: courseNames(opp.required_course_ids ?? []),
    alignedCourseNames: courseNames(opp.aligned_course_ids ?? []),
  };
}

/** All active opportunities, newest first. */
export async function getOpportunities(): Promise<OpportunityView[]> {
  const supabase = await createServerSupabaseClient();

  let raw: Opportunity[];
  if (!supabase) {
    raw = demoOpportunities;
  } else {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .order('posted_date', { ascending: false, nullsFirst: false });
    if (error) throw new Error(`opportunities: ${error.message}`);
    raw = (data ?? []) as Opportunity[];
  }

  const [companies, industries, skills, courses, oppIndustries] = await Promise.all([
    loadCompanies(),
    loadIndustries(),
    getSkills(),
    getCourses(),
    loadOpportunityIndustries(),
  ]);

  return raw
    .map((o) => decorate(o, companies, industries, skills, courses, oppIndustries))
    .filter((o) => daysUntil(o.application_deadline) !== null);
}

export async function getOpportunity(id: string): Promise<OpportunityView | null> {
  const all = await getOpportunities();
  return all.find((o) => o.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export async function getStudentProfile(
  userId?: string,
): Promise<StudentProfileView | null> {
  const supabase = await createServerSupabaseClient();
  const uid = userId ?? (await getSessionUser())?.id;

  let row: StudentProfile | null = null;
  let skillIds: string[] = [];
  let locations: string[] = [];
  let industryIds: string[] = [];

  if (!supabase || !uid) {
    const store = demoStore();
    row = store.profiles.get(uid ?? '') ?? null;
    if (row) {
      skillIds = store.skills.get(row.id) ?? [];
      locations = store.locations.get(row.id) ?? [];
      industryIds = store.industries.get(row.id) ?? [];
    }
  } else {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw new Error(`student_profiles: ${error.message}`);
    row = data as StudentProfile | null;

    if (row) {
      const [sk, loc, ind] = await Promise.all([
        supabase.from('student_skills').select('skill_id').eq('student_id', row.id),
        supabase.from('student_location_preferences').select('location').eq('student_id', row.id).order('preference_order'),
        supabase.from('student_industry_preferences').select('industry_id').eq('student_id', row.id),
      ]);
      skillIds = (sk.data ?? []).map((r) => r.skill_id);
      locations = (loc.data ?? []).map((r) => r.location);
      industryIds = (ind.data ?? []).map((r) => r.industry_id);
    }
  }

  if (!row) return null;

  const [universities, courses, skills, industries] = await Promise.all([
    getUniversities(),
    getCourses(),
    getSkills(),
    getIndustries(),
  ]);

  const session = await getSessionUser();

  return {
    ...row,
    fullName: session?.fullName ?? row.contact_email.split('@')[0],
    university: universities.find((u) => u.id === row.university_id) ?? null,
    course: courses.find((c) => c.id === row.course_id) ?? null,
    skills: skillIds
      .map((id) => skills.find((s) => s.id === id))
      .filter(Boolean) as Skill[],
    preferredLocations: locations,
    preferredIndustries: industryIds
      .map((id) => industries.find((i) => i.id === id))
      .filter(Boolean) as Industry[],
  };
}

export async function saveStudentProfile(
  userId: string,
  input: StudentProfileInput,
): Promise<StudentProfileView> {
  const supabase = await createServerSupabaseClient();

  const { skill_ids, proficiency, preferred_locations, preferred_industry_ids, ...core } = input;

  if (!supabase) {
    const store = demoStore();
    const existing = store.profiles.get(userId) ?? null;
    const row: StudentProfile = {
      id: existing?.id ?? nextDemoId('stu'),
      user_id: userId,
      ...core,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    store.profiles.set(userId, row);
    store.skills.set(row.id, skill_ids);
    store.locations.set(row.id, preferred_locations);
    store.industries.set(row.id, preferred_industry_ids);

    const view = await getStudentProfile(userId);
    if (!view) throw new Error('Failed to save profile');
    return view;
  }

  const payload = { ...core, user_id: userId, updated_at: nowIso() };

  const { data: existing } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let studentId: string;

  if (existing) {
    const { error } = await supabase
      .from('student_profiles')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw new Error(`student_profiles update: ${error.message}`);
    studentId = existing.id;
  } else {
    const { data, error } = await supabase
      .from('student_profiles')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(`student_profiles insert: ${error.message}`);
    studentId = data.id;
  }

  // Child tables are fully replaced on save. Simplest correct semantics for
  // a profile form and avoids drift from partial upserts.
  await supabase.from('student_skills').delete().eq('student_id', studentId);
  if (skill_ids.length) {
    const { error } = await supabase.from('student_skills').insert(
      skill_ids.map((skill_id) => ({
        student_id: studentId,
        skill_id,
        proficiency_level: proficiency,
      })),
    );
    if (error) throw new Error(`student_skills: ${error.message}`);
  }

  await supabase
    .from('student_location_preferences')
    .delete()
    .eq('student_id', studentId);
  if (preferred_locations.length) {
    const { error } = await supabase
      .from('student_location_preferences')
      .insert(
        preferred_locations.map((location, i) => ({
          student_id: studentId,
          location,
          preference_order: i,
        })),
      );
    if (error) throw new Error(`student_location_preferences: ${error.message}`);
  }

  await supabase
    .from('student_industry_preferences')
    .delete()
    .eq('student_id', studentId);
  if (preferred_industry_ids.length) {
    const { error } = await supabase
      .from('student_industry_preferences')
      .insert(
        preferred_industry_ids.map((industry_id, i) => ({
          student_id: studentId,
          industry_id,
          preference_order: i,
        })),
      );
    if (error) throw new Error(`student_industry_preferences: ${error.message}`);
  }

  const view = await getStudentProfile(userId);
  if (!view) throw new Error('Failed to load profile after save');
  return view;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function getApplications(
  studentId: string,
): Promise<ApplicationView[]> {
  const supabase = await createServerSupabaseClient();
  const store = demoStore();

  const rows: Application[] = [];
  const noteRows: ApplicationNote[] = [];

  if (!supabase) {
    rows.push(...store.applications.filter((a) => a.student_id === studentId));
    const ids = new Set(rows.map((r) => r.id));
    noteRows.push(...store.notes.filter((n) => ids.has(n.application_id)));
  } else {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`applications: ${error.message}`);
    rows.push(...((data ?? []) as Application[]));

    if (rows.length) {
      const { data: notes } = await supabase
        .from('application_notes')
        .select('*')
        .in(
          'application_id',
          rows.map((r) => r.id),
        );
      noteRows.push(...((notes ?? []) as ApplicationNote[]));
    }
  }

  const opportunities = await getOpportunities();

  return rows
    .map((r) => ({
      ...r,
      opportunity: opportunities.find((o) => o.id === r.opportunity_id) ?? null,
      timeline: noteRows
        .filter((n) => n.application_id === r.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getApplicationForOpportunity(
  studentId: string,
  opportunityId: string,
): Promise<ApplicationView | null> {
  const all = await getApplications(studentId);
  return all.find((a) => a.opportunity_id === opportunityId) ?? null;
}

export async function saveApplication(
  studentId: string,
  opportunityId: string,
  changes: Partial<Application>,
): Promise<ApplicationView> {
  const supabase = await createServerSupabaseClient();
  const store = demoStore();

  if (!supabase) {
    const existing = store.applications.find(
      (a) => a.student_id === studentId && a.opportunity_id === opportunityId,
    );

    if (existing) {
      Object.assign(existing, changes, { updated_at: nowIso() });
    } else {
      store.applications.push({
        id: nextDemoId('app'),
        student_id: studentId,
        opportunity_id: opportunityId,
        status: 'draft',
        generated_cover_letter: null,
        custom_cover_letter: null,
        submission_date: null,
        submission_method: null,
        last_follow_up_date: null,
        follow_up_count: 0,
        notes: null,
        match_score: null,
        match_analysis: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        ...changes,
      });
    }
  } else {
    const payload = { ...changes, student_id: studentId, opportunity_id: opportunityId };

    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw new Error(`applications update: ${error.message}`);
    } else {
      const { error } = await supabase.from('applications').insert(payload);
      if (error) throw new Error(`applications insert: ${error.message}`);
    }
  }

  const saved = await getApplicationForOpportunity(studentId, opportunityId);
  if (!saved) throw new Error('Failed to save application');
  return saved;
}

export async function addApplicationNote(
  studentId: string,
  applicationId: string,
  note: string,
  noteType: ApplicationNote['note_type'] = 'general',
): Promise<ApplicationNote> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const row: ApplicationNote = {
      id: nextDemoId('note'),
      application_id: applicationId,
      note,
      note_type: noteType,
      created_at: nowIso(),
    };
    demoStore().notes.push(row);
    return row;
  }

  const { data, error } = await supabase
    .from('application_notes')
    .insert({ application_id: applicationId, note, note_type: noteType })
    .select('*')
    .single();
  if (error) throw new Error(`application_notes: ${error.message}`);
  return data as ApplicationNote;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const store = demoStore();
    store.applications = store.applications.filter((a) => a.id !== applicationId);
    store.notes = store.notes.filter((n) => n.application_id !== applicationId);
    return;
  }
  const { error } = await supabase.from('applications').delete().eq('id', applicationId);
  if (error) throw new Error(`applications delete: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Matching context + scoring
// ---------------------------------------------------------------------------

export async function buildMatchContext(): Promise<MatchContext> {
  const [courses, skills] = await Promise.all([getCourses(), getSkills()]);

  const supabase = await createServerSupabaseClient();
  let alignments: Array<{ course_id: string; industry_id: string; alignment_score: number }> = [];

  if (!supabase) {
    alignments = Object.entries(demoAlignments).map(([key, score]) => {
      const [course_id, industry_id] = key.split(':');
      return { course_id, industry_id, alignment_score: score };
    });
  } else {
    const { data } = await supabase
      .from('course_industry_alignments')
      .select('course_id, industry_id, alignment_score');
    alignments =
      (data as typeof alignments) ??
      ([] as unknown as Array<{ course_id: string; industry_id: string; alignment_score: number }>);
  }

  return {
    coursesById: new Map(
      courses.map((c) => [c.id, { name: c.name, department: c.department }]),
    ),
    skillsById: new Map(skills.map((s) => [s.id, s.name])),
    alignments: new Map(alignments.map((a) => [`${a.course_id}:${a.industry_id}`, Number(a.alignment_score)])),
  };
}

export async function scoreOpportunities(
  student: StudentProfileView | null,
): Promise<Array<OpportunityView & { match: ReturnType<typeof matchOpportunity> }>> {
  const [opportunities, ctx] = await Promise.all([getOpportunities(), buildMatchContext()]);

  return opportunities
    .map((opp) => ({ ...opp, match: matchOpportunity(student, opp, ctx) }))
    .sort((a, b) => {
      if (b.match.overall !== a.match.overall) return b.match.overall - a.match.overall;
      return deadlineValue(a) - deadlineValue(b);
    });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

function deadlineValue(o: { application_deadline: string | null }): number {
  const d = o.application_deadline ? new Date(o.application_deadline).getTime() : Infinity;
  return Number.isNaN(d) ? Infinity : d;
}

export { dataMode };