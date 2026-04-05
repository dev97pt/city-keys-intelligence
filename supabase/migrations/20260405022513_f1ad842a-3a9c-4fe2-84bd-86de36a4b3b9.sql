
ALTER TABLE public.city_papers
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.city_papers.sections IS 'Structured sections array: [{type, id, data}]. Types: text, metrics, pro_tip, pros_cons, bullet_list, buyer_profiles, cta';
