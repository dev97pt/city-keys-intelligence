import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Trash2, Edit, GripVertical, BookOpen, Play, Save,
  ChevronDown, ChevronRight, Shield, BarChart3, Users, GraduationCap
} from "lucide-react";

/* ── Course Editor ── */
function CourseManager() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", thumbnail_url: "", price: 0, is_paid: false, category: "general", is_published: false });
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const saveCourse = async () => {
    if (!form.title.trim()) return;
    if (editingCourse) {
      await supabase.from("courses").update(form).eq("id", editingCourse.id);
      toast({ title: "Course updated" });
    } else {
      await supabase.from("courses").insert(form);
      toast({ title: "Course created" });
    }
    setShowForm(false);
    setEditingCourse(null);
    setForm({ title: "", description: "", thumbnail_url: "", price: 0, is_paid: false, category: "general", is_published: false });
    fetchCourses();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    toast({ title: "Course deleted" });
    fetchCourses();
  };

  const editCourse = (c: any) => {
    setEditingCourse(c);
    setForm({ title: c.title, description: c.description || "", thumbnail_url: c.thumbnail_url || "", price: c.price, is_paid: c.is_paid, category: c.category, is_published: c.is_published });
    setShowForm(true);
  };

  const expandCourse = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    const { data } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("order_index");
    const sorted = (data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
    }));
    setCourseModules(sorted);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">Courses</h3>
        <Button size="sm" onClick={() => { setEditingCourse(null); setForm({ title: "", description: "", thumbnail_url: "", price: 0, is_paid: false, category: "general", is_published: false }); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h4 className="font-serif font-semibold text-foreground">{editingCourse ? "Edit Course" : "New Course"}</h4>
          <Input placeholder="Course title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Thumbnail URL" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input type="number" placeholder="Price (€)" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
              <Label className="text-sm">Paid course</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label className="text-sm">Published</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveCourse}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingCourse(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {courses.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => expandCourse(c.id)}>
                {expandedCourse === c.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                    {c.is_published ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Draft</Badge>
                    )}
                    {c.is_paid && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">€{c.price}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7" onClick={() => editCourse(c)}><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => deleteCourse(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            {expandedCourse === c.id && (
              <div className="border-t border-border p-4">
                <ModuleManager courseId={c.id} modules={courseModules} onRefresh={() => expandCourse(c.id)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Module & Lesson Manager ── */
function ModuleManager({ courseId, modules, onRefresh }: { courseId: string; modules: any[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [newModule, setNewModule] = useState("");
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", video_url: "", content: "", duration_minutes: 5 });

  const addModule = async () => {
    if (!newModule.trim()) return;
    await supabase.from("modules").insert({ course_id: courseId, title: newModule, order_index: modules.length });
    setNewModule("");
    toast({ title: "Module added" });
    onRefresh();
  };

  const deleteModule = async (id: string) => {
    await supabase.from("modules").delete().eq("id", id);
    toast({ title: "Module deleted" });
    onRefresh();
  };

  const addLesson = async (moduleId: string) => {
    if (!lessonForm.title.trim()) return;
    const lessons = modules.find((m) => m.id === moduleId)?.lessons || [];
    await supabase.from("lessons").insert({ module_id: moduleId, ...lessonForm, order_index: lessons.length });
    setAddingLesson(null);
    setLessonForm({ title: "", video_url: "", content: "", duration_minutes: 5 });
    toast({ title: "Lesson added" });
    onRefresh();
  };

  const deleteLesson = async (id: string) => {
    await supabase.from("lessons").delete().eq("id", id);
    toast({ title: "Lesson deleted" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <div key={mod.id} className="rounded-lg border border-border/50 bg-secondary/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{mod.title}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAddingLesson(mod.id)}>
                <Plus className="h-3 w-3 mr-1" /> Lesson
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => deleteModule(mod.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {(mod.lessons || []).map((l: any) => (
            <div key={l.id} className="flex items-center justify-between mt-2 pl-4 text-xs">
              <div className="flex items-center gap-2">
                <Play className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{l.title}</span>
                <span className="text-muted-foreground">{l.duration_minutes}min</span>
              </div>
              <Button variant="ghost" size="sm" className="h-5 px-1 text-destructive" onClick={() => deleteLesson(l.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {addingLesson === mod.id && (
            <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
              <Input placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="h-8 text-xs" />
              <Input placeholder="Video URL (embed)" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="h-8 text-xs" />
              <Textarea placeholder="Content" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} className="text-xs min-h-[60px]" />
              <div className="flex gap-2">
                <Input type="number" placeholder="Duration (min)" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 5 })} className="h-8 text-xs w-32" />
                <Button size="sm" className="h-8 text-xs" onClick={() => addLesson(mod.id)}>Add</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAddingLesson(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="New module name" value={newModule} onChange={(e) => setNewModule(e.target.value)} className="h-8 text-xs" />
        <Button size="sm" className="h-8 text-xs" onClick={addModule}><Plus className="h-3 w-3 mr-1" /> Module</Button>
      </div>
    </div>
  );
}

/* ── Learning Path Manager ── */
function PathManager() {
  const { toast } = useToast();
  const [paths, setPaths] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPath, setEditingPath] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", is_published: false });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const fetchAll = async () => {
    const [{ data: pathData }, { data: courseData }] = await Promise.all([
      supabase.from("learning_paths").select("*, path_courses(course_id)").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("title"),
    ]);
    setPaths(pathData || []);
    setCourses(courseData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const savePath = async () => {
    if (!form.title.trim()) return;
    let pathId: string;
    if (editingPath) {
      await supabase.from("learning_paths").update(form).eq("id", editingPath.id);
      pathId = editingPath.id;
      await supabase.from("path_courses").delete().eq("path_id", pathId);
    } else {
      const { data } = await supabase.from("learning_paths").insert(form).select("id").single();
      if (!data) return;
      pathId = data.id;
    }
    if (selectedCourses.length > 0) {
      await supabase.from("path_courses").insert(selectedCourses.map((cid, i) => ({ path_id: pathId, course_id: cid, order_index: i })));
    }
    toast({ title: editingPath ? "Path updated" : "Path created" });
    setShowForm(false);
    setEditingPath(null);
    setForm({ title: "", description: "", is_published: false });
    setSelectedCourses([]);
    fetchAll();
  };

  const deletePath = async (id: string) => {
    await supabase.from("learning_paths").delete().eq("id", id);
    toast({ title: "Path deleted" });
    fetchAll();
  };

  const editPath = (p: any) => {
    setEditingPath(p);
    setForm({ title: p.title, description: p.description || "", is_published: p.is_published });
    setSelectedCourses((p.path_courses || []).map((pc: any) => pc.course_id));
    setShowForm(true);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">Learning Paths</h3>
        <Button size="sm" onClick={() => { setEditingPath(null); setForm({ title: "", description: "", is_published: false }); setSelectedCourses([]); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Path
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Input placeholder="Path title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center gap-2">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            <Label className="text-sm">Published</Label>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Courses in this path:</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer rounded p-1.5 hover:bg-secondary/30">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCourses([...selectedCourses, c.id]);
                      else setSelectedCourses(selectedCourses.filter((id) => id !== c.id));
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-foreground">{c.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={savePath}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingPath(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {paths.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{p.title}</span>
                {p.is_published ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Published</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Draft</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{(p.path_courses || []).length} courses</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7" onClick={() => editPath(p)}><Edit className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => deletePath(p.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Course Analytics ── */
function CourseAnalytics() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: courses }, { data: enrollments }, { data: purchases }] = await Promise.all([
        supabase.from("courses").select("id, title, price, is_paid"),
        supabase.from("course_enrollments").select("course_id, completed"),
        supabase.from("course_purchases").select("course_id, amount, payment_status"),
      ]);
      const courseStats = (courses || []).map((c) => {
        const courseEnroll = (enrollments || []).filter((e) => e.course_id === c.id);
        const completed = courseEnroll.filter((e) => e.completed).length;
        const revenue = (purchases || []).filter((p) => p.course_id === c.id && p.payment_status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
        return { ...c, enrollments: courseEnroll.length, completionRate: courseEnroll.length > 0 ? Math.round((completed / courseEnroll.length) * 100) : 0, revenue };
      });
      setStats(courseStats);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Total Enrollments" value={stats.reduce((s, c) => s + c.enrollments, 0)} />
        <StatCard label="Avg Completion" value={`${stats.length > 0 ? Math.round(stats.reduce((s, c) => s + c.completionRate, 0) / stats.length) : 0}%`} />
        <StatCard label="Total Revenue" value={`€${stats.reduce((s, c) => s + c.revenue, 0).toLocaleString()}`} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Enrollments</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Completion</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((c) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="px-4 py-3 text-xs text-foreground font-medium">{c.title}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.enrollments}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.completionRate}%</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">€{c.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
}

/* ── Main Admin Courses ── */
export default function AdminCourses() {
  const { isAdmin, loading } = useUserAccess();

  if (loading) return <Spinner />;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Admin Access Required</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Course Management</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create and manage courses, modules, lessons, and learning paths.</p>

      <Tabs defaultValue="courses" className="mt-8">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6"><CourseManager /></TabsContent>
        <TabsContent value="paths" className="mt-6"><PathManager /></TabsContent>
        <TabsContent value="analytics" className="mt-6"><CourseAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}
