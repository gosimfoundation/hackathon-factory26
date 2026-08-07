-- 2026 OAIC event registration fields.
-- Team size remains intentionally unset until the organizers publish a limit.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS harness text;

ALTER TABLE public.teams
  ALTER COLUMN max_size DROP DEFAULT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS round text NOT NULL DEFAULT 'qualifier',
  ADD COLUMN IF NOT EXISTS trace_url text,
  ADD COLUMN IF NOT EXISTS demo_url text;

ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_team_id_key;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_team_round_key') THEN
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_team_round_key UNIQUE (team_id, round);
  END IF;
END $$;
