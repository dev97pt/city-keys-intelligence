
-- Tighten lessons SELECT: hide drafts from non-admins
DROP POLICY IF EXISTS "Lessons viewable by authenticated" ON public.lessons;
CREATE POLICY "Lessons viewable by authenticated"
ON public.lessons FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    COALESCE(status, 'published') = 'published'
    AND EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.is_published = true
    )
  )
);

-- Tighten lesson_attachments SELECT: only when parent lesson is visible
DROP POLICY IF EXISTS "Anyone authenticated can view attachments" ON public.lesson_attachments;
CREATE POLICY "Attachments viewable when lesson visible"
ON public.lesson_attachments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_attachments.lesson_id
      AND c.is_published = true
      AND COALESCE(l.status, 'published') = 'published'
  )
);

-- Ensure video_watch_history has no anon access and is strictly per-user (already true);
-- Re-affirm explicit per-command policies to avoid relying solely on ALL.
DROP POLICY IF EXISTS "Users manage own watch history" ON public.video_watch_history;
CREATE POLICY "Users select own watch history"
ON public.video_watch_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Users insert own watch history"
ON public.video_watch_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own watch history"
ON public.video_watch_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own watch history"
ON public.video_watch_history FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Storage: restrict reads on lesson media to authenticated users (signed URLs still work).
-- Drop the broad authenticated read and replace with a policy that requires the requester
-- to be authenticated AND that the lesson referenced by the path is visible to them.
-- Since paths are opaque, keep authenticated read but block anon explicitly.
DROP POLICY IF EXISTS "Lesson media: authenticated read" ON storage.objects;
CREATE POLICY "Lesson media: authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = ANY (ARRAY['lesson-videos','lesson-thumbnails','lesson-attachments']));
