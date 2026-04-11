
-- Neighborhoods main table
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Portugal',
  price_per_m2 NUMERIC,
  yield NUMERIC,
  safety_score NUMERIC,
  transport_score NUMERIC,
  lifestyle_score NUMERIC,
  investment_score NUMERIC,
  vibe TEXT,
  risk_level TEXT,
  distance_to_center TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published neighborhoods"
  ON public.neighborhoods FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage neighborhoods"
  ON public.neighborhoods FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Neighborhood details table
CREATE TABLE public.neighborhood_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  story_intro TEXT,
  price_level TEXT,
  tourist_density TEXT,
  green_areas TEXT,
  coworking_density TEXT,
  expat_popularity TEXT,
  transport_quality TEXT,
  metro_access BOOLEAN DEFAULT false,
  parks JSONB DEFAULT '[]'::jsonb,
  markets JSONB DEFAULT '[]'::jsonb,
  hospitals JSONB DEFAULT '[]'::jsonb,
  coworking_spaces JSONB DEFAULT '[]'::jsonb,
  metro_lines JSONB DEFAULT '[]'::jsonb,
  train_stations JSONB DEFAULT '[]'::jsonb,
  bus_stations JSONB DEFAULT '[]'::jsonb,
  beach_access BOOLEAN DEFAULT false,
  bike_lanes BOOLEAN DEFAULT false,
  avg_price NUMERIC,
  price_growth NUMERIC,
  city_avg_price NUMERIC,
  ideal_for JSONB DEFAULT '[]'::jsonb,
  not_ideal_for JSONB DEFAULT '[]'::jsonb,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  kttc_insight TEXT,
  ai_story TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neighborhood_id)
);

ALTER TABLE public.neighborhood_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view neighborhood details"
  ON public.neighborhood_details FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage neighborhood details"
  ON public.neighborhood_details FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User shortlists
CREATE TABLE public.user_shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, neighborhood_id)
);

ALTER TABLE public.user_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortlists"
  ON public.user_shortlists FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to shortlist"
  ON public.user_shortlists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from shortlist"
  ON public.user_shortlists FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_neighborhoods_updated_at
  BEFORE UPDATE ON public.neighborhoods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neighborhood_details_updated_at
  BEFORE UPDATE ON public.neighborhood_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
