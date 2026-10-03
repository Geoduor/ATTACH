// Shared domain types. These mirror database/01-schema.sql.

export interface University {
  id: string;
  name: string;
  abbreviation: string | null;
  location: string;
  description?: string | null;
  website?: string | null;
}

export interface Industry {
  id: string;
  name: string;
  description?: string | null;
}

export interface Course {
  id: string;
  university_id: string;
  name: string;
  code: string | null;
  department: string | null;
  duration_years: number | null;
  description?: string | null;
}

export type SkillCategory = 'Technical' | 'Programming' | 'Soft Skills';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string | null;
}

export interface Company {
  id: string;
  name: string;
  industry_id: string | null;
  location: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  size?: string | null;
  verified: boolean;
}

export type PositionType =
  | 'attachment'
  | 'internship'
  | 'graduate_job'
  | 'entry_level';

export type ApplicationMethod = 'email' | 'form' | 'portal' | 'other';

export interface Opportunity {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  position_type: PositionType;
  required_course_ids: string[];
  aligned_course_ids: string[];
  required_skills: string[];
  preferred_skills: string[];
  location: string;
  duration_months: number | null;
  stipend: string | null;
  application_deadline: string | null; // ISO date (YYYY-MM-DD)
  application_url: string | null;
  application_method: ApplicationMethod | null;
  contact_email: string | null;
  contact_person: string | null;
  is_active: boolean;
  posted_date: string | null;
}

/** An opportunity with its company + industry + resolved name lookups. */
export interface OpportunityView extends Opportunity {
  company: Company | null;
  industry: Industry | null;
  /** UUIDs resolved to human-readable names. */
  requiredCourseNames: string[];
  alignedCourseNames: string[];
  requiredSkillNames: string[];
  preferredSkillNames: string[];
}

export type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface StudentProfile {
  id: string;
  user_id: string | null;
  university_id: string;
  course_id: string;
  year_of_study: number;
  expected_graduation_date: string | null;
  bio: string | null;
  portfolio_link: string | null;
  cv_link: string | null;
  contact_email: string;
  phone_number: string | null;
  availability_start_date: string | null;
  availability_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileInput {
  university_id: string;
  course_id: string;
  year_of_study: number;
  expected_graduation_date: string | null;
  bio: string | null;
  portfolio_link: string | null;
  cv_link: string | null;
  contact_email: string;
  phone_number: string | null;
  availability_start_date: string | null;
  availability_end_date: string | null;
  skill_ids: string[];
  proficiency: Proficiency;
  preferred_locations: string[];
  preferred_industry_ids: string[];
}

/** A student profile plus everything the matcher and UI need. */
export interface StudentProfileView extends StudentProfile {
  fullName: string;
  university: University | null;
  course: Course | null;
  skills: Skill[];
  preferredLocations: string[];
  preferredIndustries: Industry[];
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'reviewed'
  | 'interviewed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  student_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  generated_cover_letter: string | null;
  custom_cover_letter: string | null;
  submission_date: string | null;
  submission_method: string | null;
  last_follow_up_date: string | null;
  follow_up_count: number;
  /** Free-text summary the student typed on the application itself. */
  notes: string | null;
  match_score: number | null;
  match_analysis: MatchAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  note: string;
  note_type: 'update' | 'interview' | 'rejection' | 'follow_up' | 'general';
  created_at: string;
}

export interface ApplicationView extends Omit<Application, 'notes'> {
  opportunity: OpportunityView | null;
  /** Chronological entries from application_notes. */
  timeline: ApplicationNote[];
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export type MatchComponentKey =
  | 'course'
  | 'skills'
  | 'location'
  | 'industry'
  | 'duration';

export interface MatchComponent {
  key: MatchComponentKey;
  label: string;
  score: number; // 0-100
  weight: number; // contribution share, e.g. 0.35
  status: 'strong' | 'good' | 'neutral' | 'weak';
  detail: string;
}

export type MatchVerdict =
  | 'Highly Recommended'
  | 'Recommended'
  | 'Worth Considering'
  | 'Weak Fit';

export interface MatchAnalysis {
  overall: number; // 0-100
  verdict: MatchVerdict;
  components: MatchComponent[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  summary: string;
  /** 'ai' when Claude generated the narrative, 'rules' otherwise. */
  source: 'ai' | 'rules';
}

export interface ScoredOpportunity extends OpportunityView {
  match: MatchAnalysis;
}

export interface CoverLetterResult {
  cover_letter: string;
  subject_line: string;
  key_points: string[];
  interview_tips: string[];
  missing_skills: string[];
  source: 'ai' | 'template';
}

export interface ProfileInsights {
  summary: string;
  key_strengths: string[];
  recommended_industries: string[];
  skill_gaps: string[];
  source: 'ai' | 'rules';
}