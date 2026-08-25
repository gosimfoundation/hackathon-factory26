-- The homepage registry is public, but personal profile data remains private.
-- This lets signed-out visitors see registered team cards and the team count.
DROP POLICY IF EXISTS teams_select_public ON public.teams;
CREATE POLICY teams_select_public ON public.teams
  FOR SELECT TO anon, authenticated USING (true);

-- Anonymous visitors only need fields rendered by the public registry.
-- Keep contact_email, leader_id and pending_joins unavailable to them.
REVOKE SELECT ON public.teams FROM anon;
GRANT SELECT (
  id,
  name,
  avatar,
  model,
  harness,
  themes,
  project_idea,
  github_repo,
  likes,
  created_at
) ON public.teams TO anon;
