/**
 * Matching engine (Agent 2).
 *
 * Scores are computed deterministically from structured data, not from an LLM.
 * That is deliberate:
 *   - It is free and instant, so all ~40 opportunities can be scored on every
 *     page load instead of one API call per opportunity.
 *   - It is explainable: each component says exactly why it scored what it did.
 *   - It is reproducible, so a match score never changes between page loads.
 *
 * Claude is layered on top only where language genuinely helps: writing the
 * narrative analysis and the cover letter (see utils/ai.ts).
 */

import type {
  MatchAnalysis,
  MatchComponent,
  MatchVerdict,
  OpportunityView,
  StudentProfileView,
} from './types';

// Weights sum to 1.0
const W = {
  course: 0.35,
  skills: 0.3,
  industry: 0.15,
  location: 0.1,
  duration: 0.1,
} as const;

const status = (score: number): MatchComponent['status'] =>
  score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'neutral' : 'weak';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const list = (arr: string[], max = 4) =>
  arr.slice(0, max).join(', ') + (arr.length > max ? `, +${arr.length - max} more` : '');

// ---------------------------------------------------------------------------
// Component scores
// ---------------------------------------------------------------------------

function scoreCourse(
  student: StudentProfileView,
  opp: OpportunityView,
  coursesById: Map<string, { name: string; department: string | null }>,
): { score: number; detail: string } {
  const studentCourse = coursesById.get(student.course_id);
  const studentName = student.course?.name ?? '';
  const required = opp.required_course_ids
    .map((id) => coursesById.get(id)?.name)
    .filter(Boolean) as string[];
  const aligned = opp.aligned_course_ids
    .map((id) => coursesById.get(id)?.name)
    .filter(Boolean) as string[];

  if (required.includes(studentName)) {
    return {
      score: 100,
      detail: `${studentName} is an explicitly required programme for this role.`,
    };
  }
  if (aligned.includes(studentName)) {
    return {
      score: 85,
      detail: `${studentName} is listed as an aligned programme (not required, but accepted).`,
    };
  }
  if (required.length === 0 && aligned.length === 0) {
    return {
      score: 55,
      detail: 'This listing does not restrict the programme, so any course can apply.',
    };
  }

  // Match on ID rather than name: "Mechanical Engineering" exists at both TUK
  // and UoN with different IDs, and a student at one should still match the
  // other. This is the most defensible signal for a foreign programme.
  const hasSameCourseId =
    opp.required_course_ids.includes(student.course_id) ||
    opp.aligned_course_ids.includes(student.course_id);
  if (hasSameCourseId) {
    return {
      score: 95,
      detail: `${studentName} appears in this listing, though under a different institution's course record.`,
    };
  }

  // Same department is a reasonable proxy for transferable skills.
  const targetDepts = new Set(
    [...required, ...aligned]
      .map((n) => [...coursesById.values()].find((c) => c.name === n)?.department)
      .filter(Boolean) as string[],
  );
  if (studentCourse?.department && targetDepts.has(studentCourse.department)) {
    return {
      score: 60,
      detail: `Different programme, but the same ${studentCourse.department} department, so much of your coursework transfers.`,
    };
  }

  return {
    score: 25,
    detail: `This role targets ${list(required.length ? required : aligned)}. Your programme is ${studentName || 'not set'}.`,
  };
}

function scoreSkills(
  student: StudentProfileView,
  opp: OpportunityView,
  skillsById: Map<string, string>,
): { score: number; matched: string[]; missing: string[] } {
  const have = new Set(student.skills.map((s) => s.id));
  const name = (id: string) => skillsById.get(id) ?? id;

  const requiredIds = opp.required_skills ?? [];
  const preferredIds = opp.preferred_skills ?? [];

  const requiredHit = requiredIds.filter((id) => have.has(id));
  const preferredHit = preferredIds.filter((id) => have.has(id));
  const missing = requiredIds.filter((id) => !have.has(id));

  // Required skills dominate; preferred skills break ties.
  let score: number;
  if (requiredIds.length === 0 && preferredIds.length === 0) {
    score = 65; // No stated requirements; don't punish the student.
  } else {
    const requiredPart = requiredIds.length ? requiredHit.length / requiredIds.length : 1;
    const preferredPart = preferredIds.length ? preferredHit.length / preferredIds.length : 1;
    score = requiredPart * 78 + preferredPart * 22;
  }

  return {
    score: clamp(Math.round(score)),
    matched: [...requiredHit, ...preferredHit].map(name),
    missing: missing.map(name),
  };
}

function scoreLocation(
  student: StudentProfileView,
  opp: OpportunityView,
): { score: number; detail: string } {
  const prefs = student.preferredLocations.map((l) => l.toLowerCase().trim());
  const loc = opp.location.toLowerCase();

  if (prefs.length === 0) {
    return { score: 60, detail: `Based in ${opp.location}. You have not set a location preference yet.` };
  }
  if (prefs.some((p) => p === loc || loc.includes(p) || p.includes(loc))) {
    return { score: 100, detail: `${opp.location} is one of your preferred locations.` };
  }
  if (loc.includes('multiple')) {
    return { score: 80, detail: 'Multiple locations available, so you can likely be placed near home.' };
  }
  // "Nairobi" / "Mombasa" style coarse region matching.
  const regions: Record<string, string[]> = {
    nairobi: ['nairobi', 'kiambu', 'machakos', 'kajiado'],
    mombasa: ['mombasa', 'kilifi', 'kwale'],
    central: ['nyeri', 'kirinyaga', 'murang', 'machakos', 'kiambu'],
    'lake victoria': ['kisumu', 'kisii', 'bomet', 'nyamira'],
    riftvalley: ['nakuru', 'eldoret', 'kakamega', 'baringo', 'kericho'],
  };
  const home = prefs.find((p) => regions[p]?.some((r) => loc.includes(r)));
  if (home) {
    return { score: 85, detail: `${opp.location} is within the same region as ${home}.` };
  }
  return {
    score: 45,
    detail: `${opp.location} is outside your preferred areas (${student.preferredLocations.join(', ')}). Worth considering, but relocation or travel applies.`,
  };
}

function scoreIndustry(
  student: StudentProfileView,
  opp: OpportunityView,
  alignments: Map<string, number>,
): { score: number; detail: string } {
  if (!opp.industry) {
    return { score: 55, detail: 'No industry recorded for this employer.' };
  }
  const industry = opp.industry;

  const explicit = alignments.get(`${student.course_id}:${industry.id}`);
  // Fall back to department-level affinity so students without an explicit
  // alignment row still get a meaningful (not flat) score.
  const alignment = explicit ?? industryAffinityForCourse(student.course, industry.name);
  const hasExplicit = explicit !== undefined;
  const preferred = student.preferredIndustries.some((i) => i.id === industry.id);

  if (preferred && alignment > 0) {
    return {
      score: clamp(Math.round(alignment * 0.75 + 25)),
      detail: `${industry.name} is a natural fit for your programme and you named it as a preference.`,
    };
  }
  if (preferred) {
    return { score: 78, detail: `${industry.name} is one of your preferred industries.` };
  }
  if (hasExplicit) {
    return {
      score: alignment,
      detail: `${industry.name} maps ${alignment}% onto ${student.course?.name ?? 'your programme'}.`,
    };
  }
  if (alignment > 0) {
    return {
      score: alignment,
      detail: `${student.course?.department ?? 'Your department'} graduates commonly go into ${industry.name}.`,
    };
  }
  return {
    score: 45,
    detail: `${industry.name} is not a standard sector for ${student.course?.name ?? 'your programme'}, but transferrable skills still apply.`,
  };
}

function scoreDuration(
  student: StudentProfileView,
  opp: OpportunityView,
): { score: number; detail: string } {
  const months = opp.duration_months;
  if (!months) return { score: 65, detail: 'Duration not specified — confirm with the employer.' };

  const start = student.availability_start_date
    ? new Date(student.availability_start_date)
    : null;
  const end = student.availability_end_date
    ? new Date(student.availability_end_date)
    : null;

  if (!start || !end) {
    return {
      score: 65,
      detail: `Runs for ${months} months. Set your availability dates to check this properly.`,
    };
  }

  const availableMonths = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
  );
  const coverage = availableMonths / months;
  const score = clamp(Math.round(Math.min(coverage, 1) * 100));

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    score,
    detail:
      score >= 100
        ? `You are available for ${availableMonths} months (${fmt(start)} to ${fmt(end)}) and this role runs ${months} months.`
        : `You are available for ${availableMonths} months but this role runs ${months}. You would need to negotiate a shorter stint.`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MatchContext {
  coursesById: Map<string, { name: string; department: string | null }>;
  skillsById: Map<string, string>;
  alignments: Map<string, number>;
}

export function matchOpportunity(
  student: StudentProfileView | null,
  opp: OpportunityView,
  ctx: MatchContext,
): MatchAnalysis {
  if (!student) {
    return {
      overall: 0,
      verdict: 'Worth Considering',
      components: [],
      matchedSkills: [],
      missingSkills: [],
      strengths: [],
      summary:
        'Create a student profile to see how this opportunity scores against your course, skills and availability.',
      source: 'rules',
    };
  }

  const course = scoreCourse(student, opp, ctx.coursesById);
  const skills = scoreSkills(student, opp, ctx.skillsById);
  const location = scoreLocation(student, opp);
  const industry = scoreIndustry(student, opp, ctx.alignments);
  const duration = scoreDuration(student, opp);

  const components: MatchComponent[] = [
    {
      key: 'course',
      label: 'Course alignment',
      score: course.score,
      weight: W.course,
      status: status(course.score),
      detail: course.detail,
    },
    {
      key: 'skills',
      label: 'Skills match',
      score: skills.score,
      weight: W.skills,
      status: status(skills.score),
      detail:
        skills.matched.length > 0
          ? `You have ${list(skills.matched)}${skills.missing.length ? `; missing ${list(skills.missing)}` : ' — you cover everything they ask for'}.`
          : 'None of the listed skills are on your profile yet. Add them if you have them.',
    },
    {
      key: 'location',
      label: 'Location',
      score: location.score,
      weight: W.location,
      status: status(location.score),
      detail: location.detail,
    },
    {
      key: 'industry',
      label: 'Industry fit',
      score: industry.score,
      weight: W.industry,
      status: status(industry.score),
      detail: industry.detail,
    },
    {
      key: 'duration',
      label: 'Duration vs availability',
      score: duration.score,
      weight: W.duration,
      status: status(duration.score),
      detail: duration.detail,
    },
  ];

  const overall = clamp(
    Math.round(
      components.reduce((sum, c) => sum + c.score * c.weight, 0),
    ),
  );

  const verdict: MatchVerdict =
    overall >= 82
      ? 'Highly Recommended'
      : overall >= 68
        ? 'Recommended'
        : overall >= 50
          ? 'Worth Considering'
          : 'Weak Fit';

  const strengths = components
    .filter((c) => c.status === 'strong' || c.status === 'good')
    .sort((a, b) => b.score - a.score)
    .map((c) => c.label);

  const summary = buildSummary(overall, verdict, components);

  return {
    overall,
    verdict,
    components,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
    strengths,
    summary,
    source: 'rules',
  };
}

function buildSummary(
  overall: number,
  verdict: MatchVerdict,
  components: MatchComponent[],
): string {
  const best = [...components].sort((a, b) => b.score - a.score)[0];
  const worst = [...components].sort((a, b) => a.score - b.score)[0];

  const opener =
    overall >= 82
      ? `This is a strong fit for your profile at ${overall}/100.`
      : overall >= 68
        ? `This is a good fit for your profile at ${overall}/100.`
        : overall >= 50
          ? `This is a partial fit at ${overall}/100 — apply only if the gap is one you can close.`
          : `This scores ${overall}/100 and is probably not the right use of your time.`;

  return `${opener} Strongest factor: ${best.label.toLowerCase()} (${best.score}%). Weakest: ${worst.label.toLowerCase()} (${worst.score}%). Verdict: ${verdict}.`;
}

/** Recompute an existing analysis after Claude rewrote the narrative. */
export function withAiNarrative(base: MatchAnalysis, summary: string): MatchAnalysis {
  return { ...base, summary, source: 'ai' };
}

/**
 * Generic cross-industry mapping for courses that have no explicit
 * course_industry_alignments row. Keeps the industry score honest instead of
 * defaulting everyone to a flat value.
 */
const DEPARTMENT_INDUSTRY_HINTS: Record<string, string[]> = {
  Engineering: [
    'Engineering',
    'Manufacturing',
    'Energy & Utilities',
    'Construction & Real Estate',
  ],
  Computing: ['Technology & Software', 'Telecommunications', 'Finance & Banking'],
  Science: ['Technology & Software', 'Healthcare', 'Agriculture'],
  Commerce: ['Finance & Banking', 'Retail & E-commerce', 'Logistics & Supply Chain'],
  Business: ['Finance & Banking', 'Retail & E-commerce', 'Logistics & Supply Chain'],
  Hospitality: ['Hospitality & Tourism', 'Retail & E-commerce'],
  Mathematics: ['Finance & Banking', 'Technology & Software', 'Agriculture'],
  Food: ['Food Production & Technology', 'Agriculture', 'Retail & E-commerce'],
  Agribusiness: ['Agriculture', 'Food Production & Technology', 'Logistics & Supply Chain'],
};

export function industryAffinityForCourse(
  course: { department: string | null } | null | undefined,
  industryName: string,
): number {
  if (!course?.department) return 0;
  const hints = DEPARTMENT_INDUSTRY_HINTS[course.department];
  if (!hints) return 0;
  const rank = hints.indexOf(industryName);
  // Rank 0 is the best natural fit for that department.
  return rank === -1 ? 0 : 60 - rank * 8;
}