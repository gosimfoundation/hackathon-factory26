-- Store the complete member roster for each team without requiring every member
-- to create a login account. Personal roster data is visible only to the team lead.

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_primary_contact boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  github_id text,
  email text NOT NULL,
  professional_background text,
  affiliation text,
  age_range text CHECK (age_range IS NULL OR age_range IN ('18-22', '23-28', '29-35', '36+')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members(team_id);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_unique_position_idx
  ON public.team_members(team_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_primary_contact_idx
  ON public.team_members(team_id) WHERE is_primary_contact;
CREATE UNIQUE INDEX IF NOT EXISTS team_members_unique_email_idx
  ON public.team_members(team_id, lower(btrim(email)));

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Roster changes must go through replace_team_members so validation and the
-- delete/insert replacement happen atomically. Reads are still protected by RLS.
REVOKE ALL ON TABLE public.team_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.team_members TO authenticated;

DROP POLICY IF EXISTS team_members_select_leader ON public.team_members;
CREATE POLICY team_members_select_leader ON public.team_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS team_members_insert_leader ON public.team_members;
CREATE POLICY team_members_insert_leader ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS team_members_update_leader ON public.team_members;
CREATE POLICY team_members_update_leader ON public.team_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS team_members_delete_leader ON public.team_members;
CREATE POLICY team_members_delete_leader ON public.team_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.leader_id = auth.uid()
    )
  );

-- Existing teams receive one roster row based on their current team lead profile.
-- Missing optional historical fields remain empty and can be completed on next edit.
INSERT INTO public.team_members (
  team_id, position, is_primary_contact, name, github_id, email,
  professional_background, affiliation, age_range
)
SELECT
  team.id,
  0,
  true,
  COALESCE(NULLIF(profile.name, ''), NULLIF(split_part(profile.email, '@', 1), ''), team.name),
  NULLIF(profile.github_id, ''),
  COALESCE(NULLIF(profile.email, ''), NULLIF(team.contact_email, ''), ''),
  NULLIF(profile.role, ''),
  NULLIF(
    concat_ws(
      ' / ',
      NULLIF(concat_ws(', ', NULLIF(profile.city, ''), NULLIF(profile.country, '')), ''),
      NULLIF(profile.organization, '')
    ),
    ''
  ),
  CASE WHEN profile.age_range IN ('18-22', '23-28', '29-35', '36+') THEN profile.age_range ELSE NULL END
FROM public.teams AS team
JOIN public.profiles AS profile ON profile.id = team.leader_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members AS member WHERE member.team_id = team.id
);

-- Replace a complete roster atomically. The first member is the primary contact.
CREATE OR REPLACE FUNCTION public.replace_team_members(p_team_id uuid, p_members jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member jsonb;
  member_index integer := 0;
  member_count integer;
  clean_github text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = p_team_id AND teams.leader_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the team lead can update the member roster' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_members) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Member roster must be an array' USING ERRCODE = '22023';
  END IF;

  member_count := jsonb_array_length(p_members);
  IF member_count < 1 OR member_count > 20 THEN
    RAISE EXCEPTION 'A team must have between 1 and 20 members' USING ERRCODE = '22023';
  END IF;

  FOR member IN SELECT value FROM jsonb_array_elements(p_members)
  LOOP
    IF NULLIF(btrim(member->>'name'), '') IS NULL
      OR NULLIF(btrim(member->>'email'), '') IS NULL
      OR btrim(member->>'email') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      OR NULLIF(btrim(member->>'professionalBackground'), '') IS NULL
      OR NULLIF(btrim(member->>'affiliation'), '') IS NULL
      OR COALESCE(member->>'ageRange', '') NOT IN ('18-22', '23-28', '29-35', '36+')
    THEN
      RAISE EXCEPTION 'Every member requires a name, valid email, professional background, affiliation, and age range' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  DELETE FROM public.team_members WHERE team_id = p_team_id;

  FOR member IN SELECT value FROM jsonb_array_elements(p_members)
  LOOP
    clean_github := btrim(COALESCE(member->>'githubId', ''));
    clean_github := regexp_replace(clean_github, '^https?://github.com/', '', 'i');
    clean_github := trim(both '/' FROM trim(leading '@' FROM clean_github));

    INSERT INTO public.team_members (
      team_id, position, is_primary_contact, name, github_id, email,
      professional_background, affiliation, age_range, updated_at
    ) VALUES (
      p_team_id,
      member_index,
      member_index = 0,
      btrim(member->>'name'),
      NULLIF(clean_github, ''),
      lower(btrim(member->>'email')),
      btrim(member->>'professionalBackground'),
      btrim(member->>'affiliation'),
      member->>'ageRange',
      now()
    );
    member_index := member_index + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_team_members(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_team_members(uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
