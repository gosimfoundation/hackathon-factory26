-- Durable source-side outbox for Hackathon -> ARC-Bench account/team sync.
-- Configure a Database Webhook for INSERTs on this table to invoke the
-- arcbench-account-sync Edge Function with its private inbound header.

CREATE TABLE IF NOT EXISTS public.arcbench_sync_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL CHECK (source_table IN ('profiles', 'teams')),
  source_id uuid NOT NULL,
  operation text NOT NULL DEFAULT 'UPSERT' CHECK (operation IN ('UPSERT', 'DELETE')),
  record jsonb NOT NULL,
  old_record jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  lock_token uuid,
  locked_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

ALTER TABLE public.arcbench_sync_outbox
  ADD COLUMN IF NOT EXISTS operation text,
  ADD COLUMN IF NOT EXISTS lock_token uuid,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

UPDATE public.arcbench_sync_outbox SET operation = 'UPSERT' WHERE operation IS NULL;
ALTER TABLE public.arcbench_sync_outbox ALTER COLUMN operation SET DEFAULT 'UPSERT';
ALTER TABLE public.arcbench_sync_outbox ALTER COLUMN operation SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_arcbench_sync_outbox_operation'
  ) THEN
    ALTER TABLE public.arcbench_sync_outbox
      ADD CONSTRAINT ck_arcbench_sync_outbox_operation CHECK (operation IN ('UPSERT', 'DELETE'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_arcbench_sync_outbox_pending
  ON public.arcbench_sync_outbox (created_at)
  WHERE delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_arcbench_sync_outbox_available
  ON public.arcbench_sync_outbox (created_at)
  WHERE delivered_at IS NULL AND locked_at IS NULL;

ALTER TABLE public.arcbench_sync_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enqueue_arcbench_profile_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.arcbench_sync_outbox (source_table, source_id, record, old_record)
  VALUES (
    'profiles',
    NEW.id,
    to_jsonb(NEW),
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_arcbench_team_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.arcbench_sync_outbox (source_table, source_id, operation, record)
    VALUES ('teams', OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;

  INSERT INTO public.arcbench_sync_outbox (source_table, source_id, record, old_record)
  VALUES (
    'teams',
    NEW.id,
    to_jsonb(NEW),
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_arcbench_profile_sync ON public.profiles;
CREATE TRIGGER on_arcbench_profile_sync
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_arcbench_profile_sync();

DROP TRIGGER IF EXISTS on_arcbench_team_sync ON public.teams;
CREATE TRIGGER on_arcbench_team_sync
AFTER INSERT OR UPDATE OR DELETE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.enqueue_arcbench_team_sync();

-- Claim a bounded batch for one drainer. A stale lease is reclaimable after
-- ten minutes, so a crashed Edge Function cannot block future retries.
CREATE OR REPLACE FUNCTION public.claim_arcbench_sync_outbox(
  p_lock_token uuid,
  p_limit integer DEFAULT 25
)
RETURNS SETOF public.arcbench_sync_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.arcbench_sync_outbox
    WHERE delivered_at IS NULL
      AND (locked_at IS NULL OR locked_at < now() - interval '10 minutes')
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 25)
  ), claimed AS (
    UPDATE public.arcbench_sync_outbox AS outbox
    SET lock_token = p_lock_token, locked_at = now()
    FROM candidates
    WHERE outbox.id = candidates.id
    RETURNING outbox.*
  )
  SELECT * FROM claimed ORDER BY created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_arcbench_sync_outbox(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_arcbench_sync_outbox(uuid, integer) TO service_role;
