/**
 * Claude integration (Agents 1 and 3).
 *
 * SECURITY: this module runs server-side only. ANTHROPIC_API_KEY is not
 * NEXT_PUBLIC_*, so Next.js never inlines it into the client bundle. The
 * original design instantiated an Anthropic client inside a module imported by
 * client components, which would both break (the key is undefined in the
 * browser) and risk leaking the key. All AI calls go through /api/* routes.
 *
 * Every function returns a `source: 'ai'` result when the key is present and
 * falls back to a deterministic template otherwise, so the UI never has to
 * special-case "no API key".
 */

import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from './config';
import type { CoverLetterResult, MatchAnalysis, OpportunityView, ProfileInsights, StudentProfileView } from './types';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}

/** Ask for JSON and parse it, tolerating prose or code fences around it. */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

async function askJson<T>(system: string, user: string, maxTokens = 1600): Promise<T | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return extractJson<T>(text);
  } catch (error) {
    // Never let an API failure break the page. Callers fall back to templates.
    console.error('[claude] call failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

function describeStudent(s: StudentProfileView): string {
  return [
    `Name: ${s.fullName}`,
    `Email: ${s.contact_email}`,
    `University: ${s.university?.name ?? 'n/a'}`,
    `Course: ${s.course?.name ?? 'n/a'} (year ${s.year_of_study})`,
    `Expected graduation: ${s.expected_graduation_date ?? 'n/a'}`,
    `Skills: ${s.skills.map((k) => k.name).join(', ') || 'none listed'}`,
    `Preferred locations: ${s.preferredLocations.join(', ') || 'any'}`,
    `Preferred industries: ${s.preferredIndustries.map((i) => i.name).join(', ') || 'any'}`,
    `Availability: ${s.availability_start_date ?? 'flexible'} to ${s.availability_end_date ?? 'flexible'}`,
    `Portfolio: ${s.portfolio_link ?? 'none'}`,
    `CV: ${s.cv_link ?? 'none'}`,
    `Bio: ${s.bio || 'none provided'}`,
  ].join('\n');
}

function describeOpportunity(o: OpportunityView): string {
  return [
    `Title: ${o.title}`,
    `Company: ${o.company?.name ?? 'n/a'} (${o.company?.size ?? 'size unknown'}, ${o.industry?.name ?? 'industry unknown'})`,
    `Location: ${o.location}`,
    `Duration: ${o.duration_months ?? 'not stated'} months`,
    `Stipend: ${o.stipend ?? 'not stated'}`,
    `Deadline: ${o.application_deadline ?? 'not stated'}`,
    `About the company: ${o.company?.description ?? 'n/a'}`,
    `Role description: ${o.description ?? 'n/a'}`,
    `Required skills: ${o.requiredSkillNames.join(', ') || 'none stated'}`,
    `Preferred skills: ${o.preferredSkillNames.join(', ') || 'none stated'}`,
    `Target courses: ${o.requiredCourseNames.join(', ') || 'open to all'}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Agent 3: cover letter
// ---------------------------------------------------------------------------

export async function generateCoverLetter(
  student: StudentProfileView,
  opportunity: OpportunityView,
): Promise<CoverLetterResult> {
  const template = templateCoverLetter(student, opportunity);

  const result = await askJson<Omit<CoverLetterResult, 'source'>>(
    `You are a Kenyan careers adviser writing attachment and internship application letters for university students. Write letters that are specific, honest and confident. Never invent employers, qualifications or dates the student did not give you. Never claim the role is a "direct match" or that the student is trained for it when their course is unrelated to the advert — if the fit is partial or a stretch, say so plainly in the opening and argue from transferable skills instead. Write the letter body as a single string using \n\n between paragraphs, with no markdown headings.`,
    `Write a cover letter for the student below applying for the role below.

STUDENT
${describeStudent(student)}

OPPORTUNITY
${describeOpportunity(opportunity)}

Return JSON with:
- subject_line: email subject, under 70 characters
- cover_letter: 250-350 words, addressed to the hiring manager, opening with why THIS company, then the student's specific skills mapped to the requirements, then availability and a clear call to action. Close with "Yours faithfully," on its own line (the signature is added separately).
- key_points: 5-7 short interview talking points
- interview_tips: 3-5 things to prepare
- missing_skills: skills the listing wants that the student has not listed (empty array if none)`,
    2000,
  );

  if (!result || !result.cover_letter) return template;

  return {
    cover_letter: result.cover_letter,
    subject_line: result.subject_line ?? template.subject_line,
    key_points: result.key_points ?? template.key_points,
    interview_tips: result.interview_tips ?? template.interview_tips,
    missing_skills: result.missing_skills ?? template.missing_skills,
    source: 'ai',
  };
}

function templateCoverLetter(
  student: StudentProfileView,
  opportunity: OpportunityView,
): CoverLetterResult {
  const company = opportunity.company?.name ?? 'your organisation';
  const skills = student.skills.map((s) => s.name);
  const shared = opportunity.requiredSkillNames.filter((s) =>
    skills.includes(s),
  );

  // Does the advert actually target the student's course? Claiming a "direct
  // match" on a mechanical engineering advert for an accounting student would
  // be both false and the first thing a recruiter spots, so the letter reframes
  // itself around transferable strengths when the fit is thin.
  const courseId = student.course?.id ?? '';
  const courseName = student.course?.name ?? '';
  const targetsCourse = Boolean(
    courseId &&
      (opportunity.required_course_ids.includes(courseId) ||
        opportunity.aligned_course_ids.includes(courseId) ||
        opportunity.requiredCourseNames.includes(courseName) ||
        opportunity.alignedCourseNames.includes(courseName)),
  );
  const strongFit = targetsCourse && shared.length >= 2;
  const partialFit = targetsCourse || shared.length >= 2;

  const yearWord =
    student.year_of_study === 1
      ? 'first'
      : student.year_of_study === 2
        ? 'second'
        : student.year_of_study === 3
          ? 'third'
          : 'final';

  const opening = strongFit
    ? `I am writing to apply for the ${opportunity.title} position at ${company}. As a ${yearWord}-year ${courseName || 'student'} student at ${student.university?.name ?? 'my university'}, I have been looking for an attachment where I can apply my academic work to a real production problem, and this role is a direct match for what I am trained to do.`
    : partialFit
      ? `I am writing to apply for the ${opportunity.title} position at ${company}. As a ${yearWord}-year ${courseName || 'student'} student at ${student.university?.name ?? 'my university'}, I am looking for an attachment where I can apply my academic training to real commercial work, and I believe the skills I have built transfer directly to this role.`
      : `I am writing to apply for the ${opportunity.title} position at ${company}. As a ${yearWord}-year ${courseName || 'student'} student at ${student.university?.name ?? 'my university'}, I am applying outside my core discipline, but the analytical and practical grounding I have built in ${skills.slice(0, 3).join(', ') || 'my coursework'} transfers to work of this kind, and I am keen to prove that.`;

  const evidence = strongFit
    ? `The work you describe aligns closely with what I have been practising. ${shared
        .slice(0, 4)
        .join(', ')} ${shared.length === 1 ? 'is a core part of' : 'are core parts of'} my coursework and I have used ${shared.length === 1 ? 'it' : 'them'} on team projects, including presenting results to reviewers. I also bring ${student.skills
        .map((s) => s.name)
        .filter((n) => !shared.includes(n))
        .slice(0, 3)
        .join(', ') || 'strong communication and teamwork from group assignments'}.`
    : partialFit && shared.length
      ? `Several of the requirements here map onto what I already do well. ${shared
          .slice(0, 3)
          .join(', ')} ${shared.length === 1 ? 'is' : 'are'} part of my regular coursework and I have applied ${shared.length === 1 ? 'it' : 'them'} to team projects where I had to produce work other people would rely on. Alongside that I bring ${student.skills
          .map((s) => s.name)
          .filter((n) => !shared.includes(n))
          .slice(0, 3)
          .join(', ') || 'strong communication and teamwork from group assignments'}, which I use to get up to speed on unfamiliar subject matter quickly.`
      : `My course does not cover the specialist tooling this role uses, and I would rather be straightforward about that. What I do have is ${skills.slice(0, 4).join(', ') || 'strong analytical and communication skills'} and the discipline to learn a new domain properly, which is why I am applying here rather than waiting for an advert that matches my course exactly. I would be glad to start with a short induction period and be assessed on delivery.`;

  const body = [
    `Dear Hiring Manager,`,
    opening,
    evidence,
    `What draws me to ${company} specifically is ${opportunity.industry ? `the work your ${opportunity.industry.name.toLowerCase()} team does` : 'the work your team does'}${
      opportunity.company?.description ? `, and the scale of the operation you describe` : ''
    }. I want to learn from a team that works at that scale rather than repeat what I already know from class.`,
    `On availability: I am available from ${student.availability_start_date ?? 'the start of the attachment period'} to ${student.availability_end_date ?? 'the end of it'}${
      opportunity.duration_months ? `, which covers the ${opportunity.duration_months}-month duration of this role` : ''
    }.${opportunity.stipend ? ` I have noted the stated stipend of ${opportunity.stipend}.` : ''}`,
    `I would welcome the chance to discuss the role and show you my portfolio${student.portfolio_link ? ` at ${student.portfolio_link}` : ''}. Thank you for your time and consideration.`,
    `Yours faithfully,`,
  ].join('\n\n');

  return {
    cover_letter: `${body}\n${student.fullName}`,
    subject_line: `Application for ${opportunity.title} — ${student.fullName}`,
    key_points: [
      strongFit
        ? `Lead with your hands-on work in ${shared.slice(0, 2).join(' and ')}.`
        : partialFit
          ? `Lead with a project where you applied ${shared.slice(0, 2).join(' and ') || 'transferable skills'} outside your comfort zone.`
          : `Be upfront that you are cross-applying, then show one project that proves you can learn a new domain fast.`,
      strongFit
        ? `Connect your ${courseName || 'course'} coursework directly to ${company}'s work.`
        : `Explain how your ${courseName || 'degree'} training is relevant to this specific team's problems.`,
      'Be specific about the attached project or attachment you completed in this area.',
      `Confirm your availability window (${student.availability_start_date ?? 'start'} to ${student.availability_end_date ?? 'end'}) early.`,
      'Ask two questions about the role; it shows genuine preparation.',
    ],
    interview_tips: [
      'Re-read the job advert and prepare one example per requirement.',
      'Have your CV and any portfolio or GitHub link open and ready to screen-share.',
      'Practise explaining one project in two minutes and in ten minutes.',
      'Research one recent product, project or news item from the company.',
      'Prepare a question about mentoring, tooling or team structure.',
    ],
    missing_skills: opportunity.requiredSkillNames.filter((s) => !skills.includes(s)),
    source: 'template',
  };
}

// ---------------------------------------------------------------------------
// Agent 2: narrative analysis on demand
// ---------------------------------------------------------------------------

export async function explainMatch(
  student: StudentProfileView,
  opportunity: OpportunityView,
  base: MatchAnalysis,
): Promise<MatchAnalysis> {
  const lines = base.components
    .map((c) => `- ${c.label}: ${c.score}/100 — ${c.detail}`)
    .join('\n');

  const result = await askJson<{ summary: string }>(
    `You explain job-fit analysis to university students in Kenya. Be direct and specific. Reference the actual scores and details you are given rather than inventing new ones. Write 2-3 sentences in plain prose. No lists, no markdown, no emoji.`,
    `Explain this match to the student.

STUDENT
${describeStudent(student)}

OPPORTUNITY
${describeOpportunity(opportunity)}

RULE-BASED SCORES (these are computed, do not contradict them)
Overall: ${base.overall}/100
${lines}
Skills matched: ${base.matchedSkills.join(', ') || 'none'}
Skills missing: ${base.missingSkills.join(', ') || 'none'}

Return JSON with a single "summary" string.`,
    500,
  );

  if (!result?.summary) return base;
  return { ...base, summary: result.summary, source: 'ai' };
}

// ---------------------------------------------------------------------------
// Agent 1: profile analysis
// ---------------------------------------------------------------------------

export async function analyzeProfile(
  student: StudentProfileView,
  opportunities: OpportunityView[],
): Promise<ProfileInsights> {
  const topTitles = opportunities.slice(0, 8).map((o) => `${o.company?.name} — ${o.title}`).join('\n');

  const result = await askJson<Omit<ProfileInsights, 'source'>>(
    `You are a careers adviser for Kenyan university students seeking industrial attachments. Be concrete and honest. Do not inflate the student's profile; if a skill is missing, say so.`,
    `Analyse this student profile and suggest what they should do next.

STUDENT
${describeStudent(student)}

OPEN OPPORTUNITIES THEY COULD APPLY TO
${topTitles || 'none'}

Return JSON with:
- summary: 2-3 sentences on their placement readiness
- key_strengths: 3-5 concrete strengths, each referencing an actual skill or attribute they listed
- recommended_industries: 3-5 sectors that hire their kind of graduate in Kenya
- skill_gaps: 3-5 specific skills worth learning for their target sectors`,
    1200,
  );

  if (!result?.summary) return ruleBasedProfileInsights(student, opportunities);

  return {
    summary: result.summary,
    key_strengths: result.key_strengths ?? [],
    recommended_industries: result.recommended_industries ?? [],
    skill_gaps: result.skill_gaps ?? [],
    source: 'ai',
  };
}

function ruleBasedProfileInsights(
  student: StudentProfileView,
  opportunities: OpportunityView[],
): ProfileInsights {
  const have = new Set(student.skills.map((s) => s.name));
  const gaps = new Map<string, number>();

  for (const o of opportunities) {
    for (const s of o.requiredSkillNames) {
      if (!have.has(s)) gaps.set(s, (gaps.get(s) ?? 0) + 1);
    }
  }

  const ranked = [...gaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sectorCounts = new Map<string, number>();
  for (const o of opportunities) {
    if (o.industry) sectorCounts.set(o.industry.name, (sectorCounts.get(o.industry.name) ?? 0) + 1);
  }
  const sectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const completeness = [
    student.skills.length >= 5 && 'skills listed',
    !!student.cv_link && 'CV link',
    !!student.portfolio_link && 'portfolio link',
    !!student.bio && 'bio',
    !!student.availability_start_date && 'availability dates',
  ];
  const missing = completeness.filter((c) => c === false).length;

  return {
    summary: `You have ${student.skills.length} skills listed and ${missing === 0 ? 'a complete profile' : `${missing} profile field(s) still missing`}. ${
      opportunities.length
        ? `There are ${opportunities.length} open attachments you can apply to.`
        : 'There are no open attachments right now, so widen your search preferences.'
    } Add the skills below to your profile to unlock more roles.`,
    key_strengths: student.skills.slice(0, 5).map((s) => `${s.name} (${s.category})`),
    recommended_industries: sectors.map(([name]) => name),
    skill_gaps: ranked.map(([name, count]) => `${name} — required by ${count} open role(s)`),
    source: 'rules',
  };
}