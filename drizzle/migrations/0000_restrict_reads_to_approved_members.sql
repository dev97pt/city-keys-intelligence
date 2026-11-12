CREATE OR REPLACE FUNCTION public.is_approved_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'active')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_approved_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_member(uuid) TO authenticated, service_role;

ALTER POLICY "Quiz questions viewable" ON public.quiz_questions USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view likes" ON public.likes USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated can view neighborhood details" ON public.neighborhood_details USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view posts" ON public.posts USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view resources" ON public.resources USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view comments" ON public.comments USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated can view resources" ON public.course_resources USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Quizzes viewable by authenticated" ON public.quizzes USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view webinars" ON public.webinars USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can view neighborhood stats" ON public.neighborhood_stats USING (public.is_approved_member(auth.uid()));
ALTER POLICY "Authenticated users can read city-papers bucket" ON storage.objects USING (bucket_id = 'city-papers' AND public.is_approved_member(auth.uid()));
ALTER POLICY "Lesson media: authenticated read" ON storage.objects USING (bucket_id = ANY (ARRAY['lesson-videos','lesson-thumbnails','lesson-attachments']) AND public.is_approved_member(auth.uid()));