-- Baseline schema for a fresh hackathon Supabase project.
-- Later migrations extend this schema with invitations and 2026 event fields.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  github_id text,
  role text,
  avatar text,
  themes text[] NOT NULL DEFAULT '{}',
  preferred_model text,
  bio text,
  discord text,
  twitter text,
  telegram text,
  linkedin text,
  website text,
  team_id uuid,
  looking_for_team boolean NOT NULL DEFAULT false,
  password_changed boolean NOT NULL DEFAULT false,
  confirmed_attendance text,
  checked_in boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text,
  leader_id uuid NOT NULL REFERENCES public.profiles(id),
  max_size integer,
  locked boolean NOT NULL DEFAULT false,
  model text,
  harness text,
  themes text[] NOT NULL DEFAULT '{}',
  project_idea text,
  github_repo text,
  contact_email text,
  pending_joins uuid[] NOT NULL DEFAULT '{}',
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_team'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT fk_profiles_team
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round text NOT NULL DEFAULT 'qualifier'
    CHECK (round IN ('qualifier', 'grand-challenge')),
  github_url text NOT NULL,
  trace_url text NOT NULL,
  demo_url text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_team_round_key UNIQUE (team_id, round)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'used')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS teams_select_authenticated ON public.teams;
CREATE POLICY teams_select_authenticated ON public.teams
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS teams_insert_leader ON public.teams;
CREATE POLICY teams_insert_leader ON public.teams
  FOR INSERT TO authenticated WITH CHECK (leader_id = auth.uid());

DROP POLICY IF EXISTS teams_update_leader ON public.teams;
CREATE POLICY teams_update_leader ON public.teams
  FOR UPDATE TO authenticated USING (leader_id = auth.uid()) WITH CHECK (leader_id = auth.uid());

DROP POLICY IF EXISTS teams_delete_leader ON public.teams;
CREATE POLICY teams_delete_leader ON public.teams
  FOR DELETE TO authenticated USING (leader_id = auth.uid());

DROP POLICY IF EXISTS submissions_select_authenticated ON public.submissions;
CREATE POLICY submissions_select_authenticated ON public.submissions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS submissions_insert_leader ON public.submissions;
CREATE POLICY submissions_insert_leader ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = submissions.team_id AND teams.leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS submissions_update_leader ON public.submissions;
CREATE POLICY submissions_update_leader ON public.submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = submissions.team_id AND teams.leader_id = auth.uid()
    )
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = submissions.team_id AND teams.leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS announcements_select_public ON public.announcements;
CREATE POLICY announcements_select_public ON public.announcements
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS redeem_codes_select_own ON public.redeem_codes;
CREATE POLICY redeem_codes_select_own ON public.redeem_codes
  FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- Seed profiles for users that already existed before the schema was installed.
INSERT INTO public.profiles (id, email, name, created_at)
SELECT
  id,
  email,
  COALESCE(NULLIF(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
