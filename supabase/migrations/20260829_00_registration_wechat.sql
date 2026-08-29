-- Optional WeChat contact collected during event registration.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wechat text;

-- Backfill accounts that submitted the field before this migration was applied.
UPDATE public.profiles AS profile
SET wechat = NULLIF(auth_user.raw_user_meta_data->>'wechat', '')
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND NULLIF(profile.wechat, '') IS NULL
  AND NULLIF(auth_user.raw_user_meta_data->>'wechat', '') IS NOT NULL;

-- Keep profile fields synchronized with metadata submitted through Supabase Auth.
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
    id, email, name, wechat, role, bio, avatar, github_id, discord, twitter, telegram,
    linkedin, website, preferred_model, country, city, organization, age_range
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(raw->>'name',''), split_part(NEW.email, '@', 1)),
    NULLIF(raw->>'wechat',''),
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
    wechat = COALESCE(NULLIF(public.profiles.wechat,''), EXCLUDED.wechat),
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
