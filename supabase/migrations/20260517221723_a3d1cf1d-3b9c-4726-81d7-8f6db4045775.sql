
-- =====================================================================
-- 1. PROFILES: prevent PII leak + lock down status/role changes
-- =====================================================================

-- Drop the overly permissive community-wide SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles for community" ON public.profiles;

-- Safe public view: only non-sensitive fields, no email/origin/goal
CREATE OR REPLACE VIEW public.public_user_profiles
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_user_profiles TO authenticated, anon;

-- Trigger: prevent non-admin users from escalating their own status or
-- changing protected fields. Admins keep full access.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass all checks
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block self-promotion / status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change profile id';
  END IF;

  -- Email is managed via auth.updateUser; block direct profile rewrite
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email := OLD.email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- =====================================================================
-- 2. PARTNERS: hide contact_email from authenticated users
-- =====================================================================

DROP POLICY IF EXISTS "Authenticated users can view partners" ON public.partners;

-- Only admins can read raw partner rows (including contact_email)
CREATE POLICY "Admins can view all partner rows"
ON public.partners
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Safe public view excluding contact_email
CREATE OR REPLACE VIEW public.partners_public
WITH (security_invoker = on) AS
SELECT id, name, category, description, website, logo_url,
       country_id, city_id, created_at
FROM public.partners;

GRANT SELECT ON public.partners_public TO authenticated, anon;

-- =====================================================================
-- 3. CITY PAPERS: gate premium_only content to admins
-- =====================================================================

DROP POLICY IF EXISTS "Authenticated users can view city papers" ON public.city_papers;

CREATE POLICY "Authenticated users can view non-premium published papers"
ON public.city_papers
FOR SELECT
TO authenticated
USING (
  is_published = true
  AND (premium_only = false OR public.has_role(auth.uid(), 'admin'))
);

-- =====================================================================
-- 4. STORAGE: lock down city-papers bucket
-- =====================================================================

UPDATE storage.buckets SET public = false WHERE id = 'city-papers';

-- Remove any existing broad policies on this bucket
DROP POLICY IF EXISTS "Anyone can view city paper PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public read city-papers" ON storage.objects;

-- Authenticated users can download city paper PDFs
CREATE POLICY "Authenticated users can read city-papers bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'city-papers');

-- Only admins can write to city-papers bucket
CREATE POLICY "Admins can manage city-papers bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'city-papers' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'city-papers' AND public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 5. QUIZ ANSWERS: hide is_correct from learners
-- =====================================================================

DROP POLICY IF EXISTS "Quiz answers viewable" ON public.quiz_answers;

CREATE POLICY "Admins can view quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Safe view for learners: no is_correct field
CREATE OR REPLACE VIEW public.quiz_answers_public
WITH (security_invoker = on) AS
SELECT id, question_id, answer_text
FROM public.quiz_answers;

GRANT SELECT ON public.quiz_answers_public TO authenticated;
