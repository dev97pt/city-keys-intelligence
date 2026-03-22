
-- Courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  price numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  country_id uuid REFERENCES public.countries(id),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Modules table
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  content text,
  duration_minutes integer DEFAULT 5,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course Enrollments
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percentage numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Lesson Progress
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Course Resources
CREATE TABLE public.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  unlock_type text NOT NULL DEFAULT 'course_complete',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course Purchases
CREATE TABLE public.course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course Favorites
CREATE TABLE public.course_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Lesson Bookmarks
CREATE TABLE public.lesson_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- User Activity (last viewed)
CREATE TABLE public.user_lesson_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Learning Paths
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  country_id uuid REFERENCES public.countries(id),
  target_goal text,
  target_stage text,
  target_country text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Path Courses (join table)
CREATE TABLE public.path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  UNIQUE(path_id, course_id)
);

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  type text NOT NULL DEFAULT 'multiple_choice',
  order_index integer NOT NULL DEFAULT 0
);

-- Quiz Answers
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false
);

-- User Quiz Attempts
CREATE TABLE public.user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  attempt_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Quiz Answers
CREATE TABLE public.user_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.user_quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer_id uuid REFERENCES public.quiz_answers(id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS: Courses (public read for published, admin manage)
CREATE POLICY "Published courses viewable by authenticated" ON public.courses FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Modules (viewable if course is published)
CREATE POLICY "Modules viewable by authenticated" ON public.modules FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true));
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Lessons
CREATE POLICY "Lessons viewable by authenticated" ON public.lessons FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND c.is_published = true));
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Course Enrollments (own data)
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON public.course_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Lesson Progress
CREATE POLICY "Users can manage own progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: Course Resources
CREATE POLICY "Authenticated can view resources" ON public.course_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage course resources" ON public.course_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Course Purchases
CREATE POLICY "Users can view own purchases" ON public.course_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchases" ON public.course_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.course_purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Favorites
CREATE POLICY "Users can manage own favorites" ON public.course_favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: Lesson Bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.lesson_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: User Activity
CREATE POLICY "Users can manage own activity" ON public.user_lesson_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: Learning Paths
CREATE POLICY "Published paths viewable" ON public.learning_paths FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can manage paths" ON public.learning_paths FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Path Courses
CREATE POLICY "Path courses viewable" ON public.path_courses FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.learning_paths WHERE id = path_id AND is_published = true));
CREATE POLICY "Admins can manage path courses" ON public.path_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Quizzes
CREATE POLICY "Quizzes viewable by authenticated" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Quiz Questions
CREATE POLICY "Quiz questions viewable" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Quiz Answers
CREATE POLICY "Quiz answers viewable" ON public.quiz_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quiz answers" ON public.quiz_answers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: User Quiz Attempts
CREATE POLICY "Users can manage own attempts" ON public.user_quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: User Quiz Answers
CREATE POLICY "Users can manage own quiz answers" ON public.user_quiz_answers FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_quiz_attempts WHERE id = attempt_id AND user_id = auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.user_quiz_attempts WHERE id = attempt_id AND user_id = auth.uid()));

-- Update trigger for courses
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
