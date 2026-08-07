-- Keep invitation capacity checks consistent with the 2026 event's unconfirmed
-- team-size policy. A NULL max_size means no published cap is being enforced.

CREATE OR REPLACE FUNCTION public.invite_to_team(p_team_id uuid, p_user_id uuid, p_message text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_leader uuid;
  v_max int;
  v_current int;
  v_locked bool;
  v_invitee_team uuid;
  v_existing uuid;
  v_new_id uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT leader_id, max_size, locked INTO v_leader, v_max, v_locked FROM public.teams WHERE id = p_team_id;
  IF v_leader IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
  IF v_leader <> v_caller THEN RAISE EXCEPTION 'Only team leaders can invite'; END IF;
  IF v_locked THEN RAISE EXCEPTION 'Team is locked'; END IF;

  SELECT count(*) INTO v_current FROM public.profiles WHERE team_id = p_team_id;
  IF v_max IS NOT NULL AND v_current >= v_max THEN RAISE EXCEPTION 'Team is full'; END IF;

  SELECT team_id INTO v_invitee_team FROM public.profiles WHERE id = p_user_id;
  IF v_invitee_team = p_team_id THEN RAISE EXCEPTION 'User already in this team'; END IF;

  SELECT id INTO v_existing FROM public.team_invitations
    WHERE team_id = p_team_id AND invited_user_id = p_user_id AND status = 'pending';
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Invitation already pending'; END IF;

  INSERT INTO public.team_invitations(team_id, invited_user_id, invited_by, message)
    VALUES (p_team_id, p_user_id, v_caller, p_message)
    RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_to_team(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_invite(p_invite_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_team_id uuid;
  v_invitee uuid;
  v_status text;
  v_max int;
  v_current int;
  v_locked bool;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT team_id, invited_user_id, status INTO v_team_id, v_invitee, v_status
    FROM public.team_invitations WHERE id = p_invite_id;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF v_invitee <> v_caller THEN RAISE EXCEPTION 'Not your invitation'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Invitation already %', v_status; END IF;

  IF p_accept THEN
    SELECT max_size, locked INTO v_max, v_locked FROM public.teams WHERE id = v_team_id;
    IF v_locked THEN RAISE EXCEPTION 'Team is locked'; END IF;
    SELECT count(*) INTO v_current FROM public.profiles WHERE team_id = v_team_id;
    IF v_max IS NOT NULL AND v_current >= v_max THEN RAISE EXCEPTION 'Team is full'; END IF;

    UPDATE public.profiles SET team_id = v_team_id WHERE id = v_caller;
    UPDATE public.team_invitations SET status = 'accepted', responded_at = now() WHERE id = p_invite_id;
    UPDATE public.team_invitations SET status = 'cancelled', responded_at = now()
      WHERE invited_user_id = v_caller AND status = 'pending' AND id <> p_invite_id;
  ELSE
    UPDATE public.team_invitations SET status = 'declined', responded_at = now() WHERE id = p_invite_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_invite(uuid, boolean) TO authenticated;
