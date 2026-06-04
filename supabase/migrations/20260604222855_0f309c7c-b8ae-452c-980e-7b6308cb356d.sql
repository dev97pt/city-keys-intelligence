
-- 1. Extend lessons table
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS video_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS video_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS video_duration_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS prerequisite_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_complete_on_watch BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Extend lesson_progress
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS watched_percentage NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_position_seconds NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_uk
  ON public.lesson_progress(user_id, lesson_id);

-- 3. lesson_attachments
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_attachments TO authenticated;
GRANT ALL ON public.lesson_attachments TO service_role;

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view attachments"
  ON public.lesson_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage attachments"
  ON public.lesson_attachments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS lesson_attachments_lesson_idx ON public.lesson_attachments(lesson_id);

-- 4. video_watch_history
CREATE TABLE IF NOT EXISTS public.video_watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  last_position_seconds NUMERIC NOT NULL DEFAULT 0,
  watched_percentage NUMERIC NOT NULL DEFAULT 0,
  watch_count INTEGER NOT NULL DEFAULT 0,
  total_watch_seconds NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_watch_history TO authenticated;
GRANT ALL ON public.video_watch_history TO service_role;

ALTER TABLE public.video_watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watch history"
  ON public.video_watch_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all watch history"
  ON public.video_watch_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS video_watch_history_lesson_idx ON public.video_watch_history(lesson_id);

-- 5. updated_at triggers
DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_watch_history_updated_at ON public.video_watch_history;
CREATE TRIGGER update_watch_history_updated_at
  BEFORE UPDATE ON public.video_watch_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Storage RLS for lesson-videos / lesson-thumbnails / lesson-attachments
-- Drop existing duplicates if any
DROP POLICY IF EXISTS "Lesson media: authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Lesson media: admin write" ON storage.objects;
DROP POLICY IF EXISTS "Lesson media: admin update" ON storage.objects;
DROP POLICY IF EXISTS "Lesson media: admin delete" ON storage.objects;

CREATE POLICY "Lesson media: authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('lesson-videos','lesson-thumbnails','lesson-attachments'));

CREATE POLICY "Lesson media: admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('lesson-videos','lesson-thumbnails','lesson-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Lesson media: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('lesson-videos','lesson-thumbnails','lesson-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Lesson media: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('lesson-videos','lesson-thumbnails','lesson-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );
