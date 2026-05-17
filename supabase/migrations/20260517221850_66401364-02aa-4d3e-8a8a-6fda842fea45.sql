
ALTER TABLE public.city_papers
ADD COLUMN IF NOT EXISTS pdf_path TEXT;
