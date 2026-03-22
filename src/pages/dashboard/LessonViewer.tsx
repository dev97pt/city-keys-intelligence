import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check,
  ChevronLeft, ChevronRight, Play, Clock
} from "lucide-react";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !courseId || !lessonId) return;
    const load = async () => {
      const [
        { data: lessonData },
        { data: modulesData },
        { data: progressData },
        { data: bmData },
        { data: quizData },
      ] = await Promise.all([
        supabase.from("lessons").select("*, modules(title, course_id, courses(title))").eq("id", lessonId).single(),
        supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("order_index"),
        supabase.from("lesson_progress").select("completed").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle(),
        supabase.from("lesson_bookmarks").select("id").eq("user_id", user.id).eq("lesson_id", lessonId),
        supabase.from("quizzes").select("*, quiz_questions(*, quiz_answers(*))").eq("lesson_id", lessonId).maybeSingle(),
      ]);
      setLesson(lessonData);
      const sorted = (modulesData || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .flatMap((m: any) => (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index));
      setAllLessons(sorted);
      setCompleted(progressData?.completed || false);
      setBookmarked((bmData || []).length > 0);
      if (quizData) {
        setQuiz(quizData);
        setQuizQuestions((quizData.quiz_questions || []).sort((a: any, b: any) => a.order_index - b.order_index));
      }
      // Track activity
      await supabase.from("user_lesson_activity").upsert(
        { user_id: user.id, lesson_id: lessonId, last_viewed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
      setLoading(false);
    };
    load();
  }, [user, courseId, lessonId]);

  const markComplete = async () => {
    if (!user || !lessonId) return;
    await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lessonId, completed: true },
      { onConflict: "user_id,lesson_id" }
    );
    setCompleted(true);
    // Update course progress
    if (courseId) {
      const totalLessons = allLessons.length;
      const { count } = await supabase
        .from("lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("lesson_id", allLessons.map((l) => l.id));
      const pct = totalLessons > 0 ? ((count || 0) / totalLessons) * 100 : 0;
      await supabase.from("course_enrollments").update({
        progress_percentage: Math.round(pct),
        completed: pct >= 100,
      }).eq("user_id", user.id).eq("course_id", courseId);
    }
    toast({ title: "Lesson completed! ✓" });
  };

  const toggleBookmark = async () => {
    if (!user || !lessonId) return;
    if (bookmarked) {
      await supabase.from("lesson_bookmarks").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
    } else {
      await supabase.from("lesson_bookmarks").insert({ user_id: user.id, lesson_id: lessonId });
    }
    setBookmarked(!bookmarked);
  };

  const submitQuiz = async () => {
    if (!user || !quiz) return;
    let correct = 0;
    quizQuestions.forEach((q) => {
      const selectedId = selectedAnswers[q.id];
      const correctAnswer = (q.quiz_answers || []).find((a: any) => a.is_correct);
      if (correctAnswer && selectedId === correctAnswer.id) correct++;
    });
    const score = quizQuestions.length > 0 ? (correct / quizQuestions.length) * 100 : 0;
    const passed = score >= 70;
    setQuizScore(score);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    // Save attempt
    const { data: attempt } = await supabase.from("user_quiz_attempts").insert({
      user_id: user.id,
      quiz_id: quiz.id,
      score,
      passed,
    }).select("id").single();

    if (attempt) {
      const answers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        attempt_id: attempt.id,
        question_id: questionId,
        selected_answer_id: answerId,
      }));
      if (answers.length > 0) await supabase.from("user_quiz_answers").insert(answers);
    }

    if (passed && quiz.is_required) {
      markComplete();
    }
  };

  const retakeQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizPassed(false);
  };

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return <p className="text-center text-muted-foreground py-24">Lesson not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/courses/${courseId}`)} className="mb-4 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
      </Button>

      {/* Video Player */}
      {lesson.video_url && (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-black mb-6">
          <iframe
            src={lesson.video_url}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{lesson.modules?.courses?.title} · {lesson.modules?.title}</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">{lesson.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {lesson.duration_minutes || 5} min</span>
            {completed && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                <Check className="mr-1 h-3 w-3" /> Completed
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={toggleBookmark}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          {!completed && (!quiz?.is_required || quizPassed) && (
            <Button size="sm" onClick={markComplete}>
              <Check className="mr-2 h-4 w-4" /> Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {lesson.content && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80">
            {lesson.content.split("\n").map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      {quiz && quizQuestions.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            📝 {quiz.title || "Quiz"}
            {quiz.is_required && <Badge variant="outline" className="text-[10px]">Required to continue</Badge>}
          </h2>

          {quizSubmitted ? (
            <div className="mt-6 text-center">
              <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${
                quizPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}>
                {Math.round(quizScore)}%
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {quizPassed ? "Congratulations! You passed! 🎉" : "You didn't pass. Try again!"}
              </p>
              {!quizPassed && (
                <Button className="mt-4" onClick={retakeQuiz}>Retake Quiz</Button>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {quizQuestions.map((q, qi) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-foreground">{qi + 1}. {q.question}</p>
                  <div className="mt-2 space-y-2">
                    {(q.quiz_answers || []).map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: a.id })}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                          selectedAnswers[q.id] === a.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {a.answer_text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={submitQuiz}
                disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                className="w-full"
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {prevLesson ? (
          <Button variant="outline" onClick={() => navigate(`/dashboard/courses/${courseId}/lesson/${prevLesson.id}`)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
        ) : <div />}
        {nextLesson ? (
          <Button onClick={() => navigate(`/dashboard/courses/${courseId}/lesson/${nextLesson.id}`)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
            Finish <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
