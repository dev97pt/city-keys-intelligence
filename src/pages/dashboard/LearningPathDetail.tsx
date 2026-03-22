import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Play, Check, GraduationCap } from "lucide-react";

export default function LearningPathDetail() {
  const { pathId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [path, setPath] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !pathId) return;
    const load = async () => {
      const [{ data: pathData }, { data: enrollData }] = await Promise.all([
        supabase.from("learning_paths").select("*, path_courses(*, courses(*))").eq("id", pathId).single(),
        supabase.from("course_enrollments").select("course_id, progress_percentage, completed").eq("user_id", user.id),
      ]);
      setPath(pathData);
      const sorted = ((pathData as any)?.path_courses || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((pc: any) => pc.courses)
        .filter(Boolean);
      setCourses(sorted);
      setEnrollments(enrollData || []);
      setLoading(false);
    };
    load();
  }, [user, pathId]);

  const enrollAll = async () => {
    if (!user) return;
    const unenrolled = courses.filter((c) => !c.is_paid && !enrollments.some((e) => e.course_id === c.id));
    if (unenrolled.length === 0) { toast({ title: "Already enrolled in all free courses!" }); return; }
    const inserts = unenrolled.map((c) => ({ user_id: user.id, course_id: c.id }));
    await supabase.from("course_enrollments").insert(inserts);
    const newEnrollments = [...enrollments, ...inserts.map((i) => ({ ...i, progress_percentage: 0, completed: false }))];
    setEnrollments(newEnrollments);
    toast({ title: `Enrolled in ${unenrolled.length} courses!` });
  };

  if (loading) return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!path) return <p className="text-center text-muted-foreground py-24">Path not found.</p>;

  const enrolledCount = courses.filter((c) => enrollments.some((e) => e.course_id === c.id)).length;
  const overallProgress = courses.length > 0
    ? courses.reduce((sum, c) => {
        const e = enrollments.find((en) => en.course_id === c.id);
        return sum + (e?.progress_percentage || 0);
      }, 0) / courses.length
    : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/courses")} className="mb-6 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
      </Button>

      <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
        <Badge variant="outline" className="text-xs mb-3"><GraduationCap className="mr-1 h-3 w-3" /> Learning Path</Badge>
        <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-foreground">{path.title}</h1>
        {path.description && <p className="mt-3 text-sm text-muted-foreground">{path.description}</p>}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{courses.length} courses</span>
          <span>{enrolledCount} enrolled</span>
        </div>
        <Progress value={overallProgress} className="mt-3 h-2" />
        <Button className="mt-6" onClick={enrollAll}>
          <Play className="mr-2 h-4 w-4" /> Start Path — Enroll in All Free Courses
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {courses.map((c, i) => {
          const e = enrollments.find((en) => en.course_id === c.id);
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/dashboard/courses/${c.id}`)}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                e?.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/10 text-primary"
              }`}>
                {e?.completed ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                {c.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                {e && !e.completed && <Progress value={e.progress_percentage} className="mt-2 h-1" />}
              </div>
              <div className="shrink-0">
                {c.is_paid ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">€{c.price}</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Free</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
