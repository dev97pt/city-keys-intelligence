import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, BookOpen, Play, Lock, Check, Heart,
  ChevronDown, ChevronRight, Download, Clock, GraduationCap
} from "lucide-react";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const [resources, setResources] = useState<any[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !courseId) return;
    const load = async () => {
      const [
        { data: courseData },
        { data: modulesData },
        { data: enrollData },
        { data: progressData },
        { data: resData },
        { data: favData },
      ] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("order_index"),
        supabase.from("course_enrollments").select("*").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
        supabase.from("lesson_progress").select("lesson_id, completed").eq("user_id", user.id),
        supabase.from("course_resources").select("*").eq("course_id", courseId),
        supabase.from("course_favorites").select("id").eq("user_id", user.id).eq("course_id", courseId),
      ]);
      setCourse(courseData);
      // Sort lessons within each module
      const sorted = (modulesData || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || [])
          .filter((l: any) => l.status !== "draft")
          .sort((a: any, b: any) => a.order_index - b.order_index),
      }));
      setModules(sorted);
      setEnrollment(enrollData);
      const pm: Record<string, boolean> = {};
      (progressData || []).forEach((p: any) => { pm[p.lesson_id] = p.completed; });
      setLessonProgress(pm);
      setResources(resData || []);
      setIsFav((favData || []).length > 0);
      // Expand all modules by default
      setExpandedModules(new Set((modulesData || []).map((m: any) => m.id)));
      setLoading(false);
    };
    load();
  }, [user, courseId]);

  const handleEnroll = async () => {
    if (!user || !courseId) return;
    if (course?.is_paid) {
      // Trigger Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { courseId, type: "course" },
      });
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      if (data?.url) window.open(data.url, "_blank");
      return;
    }
    const { error } = await supabase.from("course_enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setEnrollment({ course_id: courseId, progress_percentage: 0, completed: false });
      toast({ title: "Enrolled successfully!" });
    }
  };

  const toggleFav = async () => {
    if (!user || !courseId) return;
    if (isFav) {
      await supabase.from("course_favorites").delete().eq("user_id", user.id).eq("course_id", courseId);
    } else {
      await supabase.from("course_favorites").insert({ user_id: user.id, course_id: courseId });
    }
    setIsFav(!isFav);
  };

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const allLessons = modules.flatMap((m) => m.lessons || []);
  const completedCount = allLessons.filter((l) => lessonProgress[l.id]).length;
  const totalCount = allLessons.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/courses")} className="mb-6 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
      </Button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {course.thumbnail_url && (
          <div className="aspect-video w-full max-h-[280px] overflow-hidden">
            <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="capitalize text-xs">{course.category}</Badge>
            {course.is_paid ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">€{course.price}</Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Free</Badge>
            )}
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-foreground">{course.title}</h1>
          {course.description && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{course.description}</p>
          )}

          <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {modules.length} modules</span>
            <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" /> {totalCount} lessons</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {allLessons.reduce((a, l) => a + (l.duration_minutes || 5), 0)} min
            </span>
          </div>

          {enrollment && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{completedCount}/{totalCount} lessons completed</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!enrollment ? (
              <Button onClick={handleEnroll} className="bg-primary text-primary-foreground">
                {course.is_paid ? `Buy Course — €${course.price}` : "Enroll Now — Free"}
              </Button>
            ) : (
              <Button onClick={() => {
                const nextLesson = allLessons.find((l) => !lessonProgress[l.id]);
                if (nextLesson) navigate(`/dashboard/courses/${courseId}/lesson/${nextLesson.id}`);
              }}>
                <Play className="mr-2 h-4 w-4" /> {completedCount > 0 ? "Continue Learning" : "Start Learning"}
              </Button>
            )}
            <Button variant="outline" onClick={toggleFav}>
              <Heart className={`mr-2 h-4 w-4 ${isFav ? "fill-primary text-primary" : ""}`} />
              {isFav ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Curriculum</h2>
        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedModules.has(mod.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">{mod.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{(mod.lessons || []).length} lessons</span>
              </button>
              {expandedModules.has(mod.id) && (
                <div className="border-t border-border/50">
                  {(mod.lessons || []).map((lesson: any, idx: number) => {
                    const isCompleted = lessonProgress[lesson.id];
                    const isLocked = !enrollment && course.is_paid;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (isLocked) return;
                          if (enrollment) navigate(`/dashboard/courses/${courseId}/lesson/${lesson.id}`);
                        }}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/20 cursor-pointer"
                        } ${idx < (mod.lessons || []).length - 1 ? "border-b border-border/30" : ""}`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                          isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                        }`}>
                          {isLocked ? <Lock className="h-3 w-3" /> : isCompleted ? <Check className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{lesson.title}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{lesson.duration_minutes || 5} min</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Resources</h2>
          <div className="space-y-2">
            {resources.map((r) => {
              const unlocked = r.unlock_type === "course_complete" ? enrollment?.completed : true;
              return (
                <div key={r.id} className={`flex items-center justify-between rounded-lg border border-border bg-card p-4 ${!unlocked ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{r.title}</span>
                  </div>
                  {unlocked && r.file_url ? (
                    <a href={r.file_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">Download</Button>
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[10px]"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
