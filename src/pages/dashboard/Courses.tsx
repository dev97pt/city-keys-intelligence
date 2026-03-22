import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  Search, BookOpen, Play, Heart, Bookmark, Star, Clock,
  GraduationCap, ArrowRight, Filter
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_paid: boolean;
  category: string;
  is_published: boolean;
  country_id: string | null;
};

type Enrollment = {
  course_id: string;
  progress_percentage: number;
  completed: boolean;
};

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<any[]>([]);
  const [lastActivity, setLastActivity] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "free" | "paid">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [
        { data: coursesData },
        { data: enrollData },
        { data: favsData },
        { data: bookmarkData },
        { data: activityData },
        { data: pathsData },
      ] = await Promise.all([
        supabase.from("courses").select("*").eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("course_enrollments").select("course_id, progress_percentage, completed").eq("user_id", user.id),
        supabase.from("course_favorites").select("course_id").eq("user_id", user.id),
        supabase.from("lesson_bookmarks").select("lesson_id, lessons(id, title, module_id, modules(course_id, courses(title)))").eq("user_id", user.id) as any,
        supabase.from("user_lesson_activity").select("lesson_id, last_viewed_at, lessons(id, title, module_id, modules(course_id, courses(id, title)))").eq("user_id", user.id).order("last_viewed_at", { ascending: false }).limit(5) as any,
        supabase.from("learning_paths").select("*, path_courses(course_id)").eq("is_published", true),
      ]);
      setCourses(coursesData || []);
      setEnrollments(enrollData || []);
      setFavorites((favsData || []).map((f: any) => f.course_id));
      setBookmarkedLessons(bookmarkData || []);
      setLastActivity(activityData || []);
      setLearningPaths(pathsData || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleFavorite = async (courseId: string) => {
    if (!user) return;
    if (favorites.includes(courseId)) {
      await supabase.from("course_favorites").delete().eq("user_id", user.id).eq("course_id", courseId);
      setFavorites(favorites.filter((f) => f !== courseId));
    } else {
      await supabase.from("course_favorites").insert({ user_id: user.id, course_id: courseId });
      setFavorites([...favorites, courseId]);
    }
  };

  const enroll = async (courseId: string) => {
    if (!user) return;
    const course = courses.find((c) => c.id === courseId);
    if (course?.is_paid) {
      navigate(`/dashboard/courses/${courseId}`);
      return;
    }
    await supabase.from("course_enrollments").insert({ user_id: user.id, course_id: courseId });
    setEnrollments([...enrollments, { course_id: courseId, progress_percentage: 0, completed: false }]);
  };

  const categories = [...new Set(courses.map((c) => c.category))];

  const filtered = courses.filter((c) => {
    if (filterType === "free" && c.is_paid) return false;
    if (filterType === "paid" && !c.is_paid) return false;
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.title.toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s);
    }
    return true;
  });

  const enrolledCourses = courses.filter((c) => enrollments.some((e) => e.course_id === c.id));
  const inProgressCourses = enrolledCourses.filter((c) => {
    const e = enrollments.find((en) => en.course_id === c.id);
    return e && !e.completed;
  });
  const favoriteCourses = courses.filter((c) => favorites.includes(c.id));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Courses & Webinars</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your private academy for relocation and real estate investment mastery.
        </p>
      </div>

      {/* Continue Learning */}
      {(lastActivity.length > 0 || inProgressCourses.length > 0) && (
        <Section title="Continue Learning" icon={<Play className="h-5 w-5 text-primary" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lastActivity.slice(0, 3).map((a: any) => {
              const course = a.lessons?.modules?.courses;
              if (!course) return null;
              const enrollment = enrollments.find((e) => e.course_id === course.id);
              return (
                <div
                  key={a.lesson_id}
                  onClick={() => navigate(`/dashboard/courses/${course.id}/lesson/${a.lesson_id}`)}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <p className="text-xs text-muted-foreground">{course.title}</p>
                  <h4 className="mt-1 font-serif text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {a.lessons.title}
                  </h4>
                  {enrollment && (
                    <Progress value={enrollment.progress_percentage} className="mt-3 h-1.5" />
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {enrollment ? `${Math.round(enrollment.progress_percentage)}% complete` : "Resume"}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* My Courses */}
      {enrolledCourses.length > 0 && (
        <Section title="My Courses" icon={<GraduationCap className="h-5 w-5 text-primary" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((c) => {
              const e = enrollments.find((en) => en.course_id === c.id)!;
              return (
                <CourseCard
                  key={c.id}
                  course={c}
                  enrollment={e}
                  isFav={favorites.includes(c.id)}
                  onFav={() => toggleFavorite(c.id)}
                  onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Saved Lessons */}
      {bookmarkedLessons.length > 0 && (
        <Section title="Saved Lessons" icon={<Bookmark className="h-5 w-5 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarkedLessons.map((b: any) => {
              const course = b.lessons?.modules?.courses;
              return (
                <div
                  key={b.lesson_id}
                  onClick={() => course && navigate(`/dashboard/courses/${course.id}/lesson/${b.lesson_id}`)}
                  className="cursor-pointer rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{course?.title || "Course"}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{b.lessons?.title}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Favorites */}
      {favoriteCourses.length > 0 && (
        <Section title="Favorites" icon={<Heart className="h-5 w-5 text-primary" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteCourses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                enrollment={enrollments.find((e) => e.course_id === c.id)}
                isFav={true}
                onFav={() => toggleFavorite(c.id)}
                onClick={() => navigate(`/dashboard/courses/${c.id}`)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Learning Paths */}
      {learningPaths.length > 0 && (
        <Section title="Learning Paths" icon={<Star className="h-5 w-5 text-primary" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            {learningPaths.map((p: any) => {
              const pathCourseIds = (p.path_courses || []).map((pc: any) => pc.course_id);
              const enrolled = pathCourseIds.filter((id: string) => enrollments.some((e) => e.course_id === id)).length;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/dashboard/learning-paths/${p.id}`)}
                  className="cursor-pointer rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all"
                >
                  <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                  {p.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{pathCourseIds.length} courses</span>
                    <span>{enrolled}/{pathCourseIds.length} enrolled</span>
                  </div>
                  {pathCourseIds.length > 0 && (
                    <Progress value={(enrolled / pathCourseIds.length) * 100} className="mt-3 h-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* All Courses */}
      <Section title="All Courses" icon={<BookOpen className="h-5 w-5 text-primary" />}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5">
            {(["all", "free", "paid"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                  filterType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterCategory("all")}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  filterCategory === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                    filterCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                enrollment={enrollments.find((e) => e.course_id === c.id)}
                isFav={favorites.includes(c.id)}
                onFav={() => toggleFavorite(c.id)}
                onClick={() => {
                  const enrolled = enrollments.some((e) => e.course_id === c.id);
                  if (enrolled) {
                    navigate(`/dashboard/courses/${c.id}`);
                  } else if (!c.is_paid) {
                    enroll(c.id);
                  } else {
                    navigate(`/dashboard/courses/${c.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CourseCard({
  course,
  enrollment,
  isFav,
  onFav,
  onClick,
}: {
  course: Course;
  enrollment?: Enrollment;
  isFav: boolean;
  onFav: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-secondary/30 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            className="rounded-full bg-background/80 p-1.5 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
        {enrollment && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={enrollment.progress_percentage} className="h-1 rounded-none" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">{course.category}</Badge>
          {course.is_paid ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">€{course.price}</Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Free</Badge>
          )}
        </div>
        <h3 className="mt-2 font-serif text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.description}</p>
        )}
        {enrollment && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {enrollment.completed ? "✓ Completed" : `${Math.round(enrollment.progress_percentage)}% complete`}
          </p>
        )}
      </div>
    </div>
  );
}
