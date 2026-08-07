# Supabase Setup

## 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project. Note your project URL and anon key.

## 2. Create Tables

Run the following SQL in the Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  github_id text,
  role text,
  avatar text,
  themes text[],
  preferred_model text,
  bio text,
  discord text,
  twitter text,
  telegram text,
  linkedin text,
  website text,
  team_id uuid,
  looking_for_team boolean DEFAULT false,
  password_changed boolean DEFAULT false,
  confirmed_attendance text,
  checked_in boolean DEFAULT false,
  approved boolean DEFAULT false,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text,
  leader_id uuid REFERENCES public.profiles(id),
  max_size int,
  locked boolean DEFAULT false,
  model text,
  harness text,
  themes text[],
  project_idea text,
  github_repo text,
  contact_email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "teams_update_leader" ON public.teams FOR UPDATE TO authenticated USING (leader_id = auth.uid());

-- Add foreign key from profiles to teams
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_team FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  round text NOT NULL DEFAULT 'qualifier' CHECK (round IN ('qualifier', 'grand-challenge')),
  github_url text NOT NULL,
  trace_url text NOT NULL,
  demo_url text NOT NULL,
  submitted_by uuid REFERENCES public.profiles(id),
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (team_id, round)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "submissions_upsert" ON public.submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE TO authenticated USING (true);

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements_manage" ON public.announcements FOR ALL TO authenticated USING (true);

-- Redeem codes table
CREATE TABLE public.redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  model text NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used')),
  assigned_to uuid REFERENCES public.profiles(id),
  assigned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "codes_select_own" ON public.redeem_codes FOR SELECT TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "codes_manage" ON public.redeem_codes FOR ALL TO authenticated USING (true);

-- Admin config table
CREATE TABLE public.admin_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_config_select" ON public.admin_config FOR SELECT TO authenticated USING (true);

-- Set your admin password (replace 'your-password' with your actual password)
-- INSERT INTO admin_config (key, value)
-- VALUES ('admin_pass_hash', encode(sha256('your-password'), 'hex'));
```

## 3. Team Invitations

Run the migration SQL from `supabase/migrations/20260421_02_team_invitations.sql` for the invitation system (invite, accept, decline, cancel RPCs).

## 4. Leave Team RPC

Run the migration SQL from `supabase/migrations/20260421_01_leave_team_rpc.sql`.

## 5. Enable Realtime

In Supabase Dashboard > Database > Replication, enable realtime for:
- `profiles`
- `teams`
- `announcements`
- `team_invitations`

## 6. Auth Settings

In Supabase Dashboard > Authentication > Settings:
- Enable email confirmations (or disable for development)
- Set your site URL for redirect
- Optionally enable auto-confirm for development
