-- Registration demographics collected for the 2026 OAIC event.
-- Existing profiles remain valid; the website requires these fields for new registrations.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS age_range text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_age_range_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_age_range_check
      CHECK (age_range IS NULL OR age_range IN ('18-22', '23-28', '29-35', '36+'));
  END IF;
END $$;

-- Keep new registration fields in sync with the metadata submitted to Supabase Auth.
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  clean_gh text;
BEGIN
  clean_gh := TRIM(REPLACE(REPLACE(COALESCE(raw->>'github_id',''), 'https://github.com/', ''), '@', ''));
  IF clean_gh LIKE '%.%' OR clean_gh = '' THEN clean_gh := NULL; END IF;

  INSERT INTO public.profiles (
    id, email, name, role, bio, avatar, github_id, discord, twitter, telegram,
    linkedin, website, preferred_model, country, city, organization, age_range
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(raw->>'name',''), split_part(NEW.email, '@', 1)),
    NULLIF(raw->>'role',''),
    NULLIF(raw->>'bio',''),
    NULLIF(raw->>'avatar',''),
    clean_gh,
    NULLIF(raw->>'discord',''),
    NULLIF(raw->>'twitter',''),
    NULLIF(raw->>'telegram',''),
    NULLIF(raw->>'linkedin',''),
    NULLIF(raw->>'website',''),
    NULLIF(raw->>'preferred_model',''),
    NULLIF(raw->>'country',''),
    NULLIF(raw->>'city',''),
    NULLIF(raw->>'organization',''),
    CASE
      WHEN raw->>'age_range' IN ('18-22', '23-28', '29-35', '36+') THEN raw->>'age_range'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(public.profiles.email,''), EXCLUDED.email),
    name = COALESCE(NULLIF(public.profiles.name,''), EXCLUDED.name),
    role = COALESCE(NULLIF(public.profiles.role,''), EXCLUDED.role),
    bio = COALESCE(NULLIF(public.profiles.bio,''), EXCLUDED.bio),
    avatar = COALESCE(NULLIF(public.profiles.avatar,''), EXCLUDED.avatar),
    github_id = COALESCE(NULLIF(public.profiles.github_id,''), EXCLUDED.github_id),
    discord = COALESCE(NULLIF(public.profiles.discord,''), EXCLUDED.discord),
    twitter = COALESCE(NULLIF(public.profiles.twitter,''), EXCLUDED.twitter),
    telegram = COALESCE(NULLIF(public.profiles.telegram,''), EXCLUDED.telegram),
    linkedin = COALESCE(NULLIF(public.profiles.linkedin,''), EXCLUDED.linkedin),
    website = COALESCE(NULLIF(public.profiles.website,''), EXCLUDED.website),
    preferred_model = COALESCE(NULLIF(public.profiles.preferred_model,''), EXCLUDED.preferred_model),
    country = COALESCE(NULLIF(public.profiles.country,''), EXCLUDED.country),
    city = COALESCE(NULLIF(public.profiles.city,''), EXCLUDED.city),
    organization = COALESCE(NULLIF(public.profiles.organization,''), EXCLUDED.organization),
    age_range = COALESCE(NULLIF(public.profiles.age_range,''), EXCLUDED.age_range);

  RETURN NEW;
END;
$$;

