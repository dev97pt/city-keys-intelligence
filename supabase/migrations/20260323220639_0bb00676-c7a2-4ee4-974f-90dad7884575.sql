
ALTER TABLE public.city_papers
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid;
