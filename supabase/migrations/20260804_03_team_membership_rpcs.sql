-- Restrict cross-user team membership changes to validated SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION public.request_join_team(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_team public.teams%ROWTYPE;
  v_member_count integer;
  v_current_team uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id FOR UPDATE;
  IF v_team.id IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  IF v_team.locked THEN RAISE EXCEPTION 'Team is locked'; END IF;

  SELECT team_id INTO v_current_team FROM public.profiles WHERE id = v_caller;
  IF v_current_team IS NOT NULL THEN RAISE EXCEPTION 'Leave your current team first'; END IF;

  SELECT count(*) INTO v_member_count FROM public.profiles WHERE team_id = p_team_id;
  IF v_team.max_size IS NOT NULL AND v_member_count >= v_team.max_size THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  UPDATE public.teams
  SET pending_joins = array_append(pending_joins, v_caller)
  WHERE id = p_team_id AND NOT (v_caller = ANY(pending_joins));
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_join_request(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.teams
  SET pending_joins = array_remove(pending_joins, v_caller)
  WHERE id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_join_request(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_leader uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT leader_id INTO v_leader FROM public.teams WHERE id = p_team_id FOR UPDATE;
  IF v_leader IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  IF v_leader <> v_caller THEN RAISE EXCEPTION 'Only the team leader can reject requests'; END IF;

  UPDATE public.teams
  SET pending_joins = array_remove(pending_joins, p_user_id)
  WHERE id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_team_member(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_team public.teams%ROWTYPE;
  v_member_count integer;
  v_current_team uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id FOR UPDATE;
  IF v_team.id IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  IF v_team.leader_id <> v_caller THEN RAISE EXCEPTION 'Only the team leader can approve requests'; END IF;
  IF NOT (p_user_id = ANY(v_team.pending_joins)) THEN RAISE EXCEPTION 'Join request not found'; END IF;

  SELECT team_id INTO v_current_team FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current_team IS NOT NULL THEN RAISE EXCEPTION 'User is already on a team'; END IF;

  SELECT count(*) INTO v_member_count FROM public.profiles WHERE team_id = p_team_id;
  IF v_team.max_size IS NOT NULL AND v_member_count >= v_team.max_size THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  UPDATE public.profiles SET team_id = p_team_id WHERE id = p_user_id;
  UPDATE public.teams
  SET pending_joins = array_remove(pending_joins, p_user_id)
  WHERE id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.kick_team_member(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_leader uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT leader_id INTO v_leader FROM public.teams WHERE id = p_team_id FOR UPDATE;
  IF v_leader IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  IF v_leader <> v_caller THEN RAISE EXCEPTION 'Only the team leader can remove members'; END IF;
  IF p_user_id = v_leader THEN RAISE EXCEPTION 'The team leader cannot be removed'; END IF;

  UPDATE public.profiles
  SET team_id = NULL
  WHERE id = p_user_id AND team_id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.like_team(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.teams SET likes = likes + 1 WHERE id = p_team_id RETURNING likes INTO v_likes;
  IF v_likes IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  RETURN v_likes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_join_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kick_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.like_team(uuid) TO authenticated;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['profiles', 'teams', 'announcements', 'team_invitations']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END $$;
