-- ============================================================================
-- Attachment Placement Agent - Supabase Schema
-- Run this FIRST in Supabase SQL Editor.
-- Safe to re-run (all statements are IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- 0. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. updated_at auto-maintenance
--    The original schema declared updated_at but never kept it in sync.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_touch ON public.profiles;
CREATE TRIGGER trg_profiles_touch
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create a profile row whenever a user signs up.
-- The original schema created the table but never populated it, so
-- student_profiles.user_id had nothing to reference.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Reference data (public read)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  abbreviation TEXT,
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  department TEXT,
  duration_years INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, code)
);

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Student profile
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
  expected_graduation_date DATE,
  bio TEXT,
  portfolio_link TEXT,
  cv_link TEXT,
  contact_email TEXT NOT NULL,
  phone_number TEXT,
  availability_start_date DATE,
  availability_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT availability_is_ordered
    CHECK (availability_end_date IS NULL
           OR availability_start_date IS NULL
           OR availability_end_date >= availability_start_date)
);

DROP TRIGGER IF EXISTS trg_student_profiles_touch ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_touch
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner','intermediate','advanced','expert')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.student_location_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  preference_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, location)
);

CREATE TABLE IF NOT EXISTS public.student_industry_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  preference_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, industry_id)
);

-- ----------------------------------------------------------------------------
-- 5. Employers & opportunities (public read)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  size TEXT CHECK (size IN ('startup','small','medium','large','enterprise')),
  year_founded INTEGER,
  logo_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_companies_touch ON public.companies;
CREATE TRIGGER trg_companies_touch
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position_type TEXT CHECK (position_type IN ('attachment','internship','graduate_job','entry_level')),
  required_course_ids UUID[] NOT NULL DEFAULT '{}',
  aligned_course_ids UUID[] NOT NULL DEFAULT '{}',
  required_skills UUID[] NOT NULL DEFAULT '{}',
  preferred_skills UUID[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  duration_months INTEGER,
  stipend TEXT,
  application_deadline DATE,
  application_url TEXT,
  application_method TEXT CHECK (application_method IN ('email','form','portal','other')),
  contact_email TEXT,
  contact_person TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT NOT NULL DEFAULT 'manual',
  scraped_date TIMESTAMPTZ,
  posted_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_opportunities_touch ON public.opportunities;
CREATE TRIGGER trg_opportunities_touch
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.opportunity_industries (
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, industry_id)
);

CREATE TABLE IF NOT EXISTS public.course_industry_alignments (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  alignment_score NUMERIC(5,2) NOT NULL CHECK (alignment_score BETWEEN 0 AND 100),
  description TEXT,
  PRIMARY KEY (course_id, industry_id)
);

-- ----------------------------------------------------------------------------
-- 6. Applications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','pending','reviewed','interviewed','accepted','rejected','withdrawn')),
  generated_cover_letter TEXT,
  custom_cover_letter TEXT,
  submission_date TIMESTAMPTZ,
  submission_method TEXT,
  last_follow_up_date TIMESTAMPTZ,
  follow_up_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  match_score NUMERIC(5,2),
  match_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, opportunity_id)
);

DROP TRIGGER IF EXISTS trg_applications_touch ON public.applications;
CREATE TRIGGER trg_applications_touch
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('update','interview','rejection','follow_up','general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_university          ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user       ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student      ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry         ON public.companies(industry_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company      ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_active       ON public.opportunities(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline     ON public.opportunities(application_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_student       ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity   ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status        ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_application_notes_app      ON public.application_notes(application_id);
-- GIN indexes so `required_skills && <uuid[]>` overlap queries are index-backed.
CREATE INDEX IF NOT EXISTS idx_opportunities_req_skills   ON public.opportunities USING GIN (required_skills);
CREATE INDEX IF NOT EXISTS idx_opportunities_req_courses  ON public.opportunities USING GIN (required_course_ids);

-- ============================================================================
-- 8. Row Level Security
--
--    NOTE ON THE ORIGINAL SCHEMA: it enabled RLS on student_profiles and
--    applications but only defined SELECT policies. Every INSERT/UPDATE the
--    app performs was therefore rejected. The policies below are complete.
--
--    Reference tables keep RLS *disabled* on purpose: they are public
--    catalogue data that every visitor (including anonymous users) must be
--    able to read. Writes to those tables happen server-side with the
--    service-role key, which bypasses RLS entirely.
-- ============================================================================

ALTER TABLE public.student_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_industry_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;

-- Helper: does the given auth user own this student profile row?
-- SECURITY DEFINER lets the subquery read student_profiles from inside the
-- applications/application_notes policies without recursing into RLS again.
CREATE OR REPLACE FUNCTION public.owns_student_profile(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = p_student_id
      AND sp.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY STABLE AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', '') = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.email = 'admin@attachmentplacement.co.ke'
      );
$$;

-- profiles -------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- student_profiles ------------------------------------------------------------
DROP POLICY IF EXISTS "students_select_own" ON public.student_profiles;
CREATE POLICY "students_select_own" ON public.student_profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "students_insert_own" ON public.student_profiles;
CREATE POLICY "students_insert_own" ON public.student_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "students_update_own" ON public.student_profiles;
CREATE POLICY "students_update_own" ON public.student_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "students_delete_own" ON public.student_profiles;
CREATE POLICY "students_delete_own" ON public.student_profiles
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- student_skills --------------------------------------------------------------
DROP POLICY IF EXISTS "student_skills_all_own" ON public.student_skills;
CREATE POLICY "student_skills_all_own" ON public.student_skills
  FOR ALL
  USING (public.owns_student_profile(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_profile(student_id) OR public.is_admin());

-- preferences -----------------------------------------------------------------
DROP POLICY IF EXISTS "loc_prefs_all_own" ON public.student_location_preferences;
CREATE POLICY "loc_prefs_all_own" ON public.student_location_preferences
  FOR ALL
  USING (public.owns_student_profile(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_profile(student_id) OR public.is_admin());

DROP POLICY IF EXISTS "ind_prefs_all_own" ON public.student_industry_preferences;
CREATE POLICY "ind_prefs_all_own" ON public.student_industry_preferences
  FOR ALL
  USING (public.owns_student_profile(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_profile(student_id) OR public.is_admin());

-- applications ----------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
CREATE POLICY "applications_select_own" ON public.applications
  FOR SELECT USING (public.owns_student_profile(student_id) OR public.is_admin());

DROP POLICY IF EXISTS "applications_insert_own" ON public.applications;
CREATE POLICY "applications_insert_own" ON public.applications
  FOR INSERT WITH CHECK (public.owns_student_profile(student_id) OR public.is_admin());

DROP POLICY IF EXISTS "applications_update_own" ON public.applications;
CREATE POLICY "applications_update_own" ON public.applications
  FOR UPDATE USING (public.owns_student_profile(student_id) OR public.is_admin())
  WITH CHECK (public.owns_student_profile(student_id) OR public.is_admin());

DROP POLICY IF EXISTS "applications_delete_own" ON public.applications;
CREATE POLICY "applications_delete_own" ON public.applications
  FOR DELETE USING (public.owns_student_profile(student_id) OR public.is_admin());

-- application_notes -----------------------------------------------------------
DROP POLICY IF EXISTS "app_notes_all_own" ON public.application_notes;
CREATE POLICY "app_notes_all_own" ON public.application_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
        AND (public.owns_student_profile(a.student_id) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
        AND (public.owns_student_profile(a.student_id) OR public.is_admin())
    )
  );

-- ============================================================================
-- Done. Expected tables (11 app tables + profiles):
--   profiles, universities, industries, courses, skills, student_profiles,
--   student_skills, student_location_preferences, student_industry_preferences,
--   companies, opportunities, opportunity_industries, course_industry_alignments,
--   applications, application_notes
-- ============================================================================