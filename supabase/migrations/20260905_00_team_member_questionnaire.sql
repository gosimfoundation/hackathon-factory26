-- Add optional questionnaire answers to each private team-member record.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS agents_used text,
  ADD COLUMN IF NOT EXISTS school_major text,
  ADD COLUMN IF NOT EXISTS proud_project text;

-- Keep roster replacement atomic while accepting the new optional answers.
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
      professional_background, affiliation, age_range, agents_used,
      school_major, proud_project, updated_at
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
      NULLIF(btrim(COALESCE(member->>'agentsUsed', '')), ''),
      NULLIF(btrim(COALESCE(member->>'schoolMajor', '')), ''),
      NULLIF(btrim(COALESCE(member->>'proudProject', '')), ''),
      now()
    );
    member_index := member_index + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_team_members(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_team_members(uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
