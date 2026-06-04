import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Edit, GripVertical, Play, Save, ChevronDown, ChevronRight,
  Shield, Copy, EyeOff, Eye, MoreVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LessonEditor from "@/components/admin/LessonEditor";

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

  const duplicateCourse = async (c: any) => {
    const { data: newCourse } = await supabase.from("courses").insert({
      title: `${c.title} (copy)`,
      description: c.description, thumbnail_url: c.thumbnail_url,
      price: c.price, is_paid: c.is_paid, category: c.category, is_published: false,
    }).select("*").single();
    if (!newCourse) return;
    const { data: mods } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", c.id).order("order_index");
    for (const m of mods || []) {
      const { data: newMod } = await supabase.from("modules").insert({
        course_id: newCourse.id, title: m.title, order_index: m.order_index,
      }).select("id").single();
      if (!newMod) continue;
      const lessons = (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
      if (lessons.length) {
        await supabase.from("lessons").insert(lessons.map((l: any) => ({
          module_id: newMod.id, title: l.title, description: l.description, content: l.content,
          duration_minutes: l.duration_minutes, order_index: l.order_index, status: "draft",
          video_url: l.video_url, // note: storage paths are not duplicated to avoid double-references
          auto_complete_on_watch: l.auto_complete_on_watch,
        })));
      }
    }
    toast({ title: "Course duplicated" });
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

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No courses yet. Click "New Course" to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => expandCourse(c.id)}>
                  {expandedCourse === c.id ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{c.title}</span>
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
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => duplicateCourse(c)} title="Duplicate">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => editCourse(c)} title="Edit"><Edit className="h-3 w-3" /></Button>
                  <ConfirmDelete onConfirm={() => deleteCourse(c.id)} label={`Delete course "${c.title}"?`} description="All modules, lessons, videos and attachments will be deleted." />
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
      )}
    </div>
  );
}

/* ── Sortable Module Card ── */
function SortableModule({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return <div ref={setNodeRef} style={style}>{children({ ...attributes, ...listeners })}</div>;
}

/* ── Sortable Lesson Row ── */
function SortableLesson({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return <div ref={setNodeRef} style={style}>{children({ ...attributes, ...listeners })}</div>;
}

/* ── Module & Lesson Manager ── */
function ModuleManager({ courseId, modules, onRefresh }: { courseId: string; modules: any[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [newModule, setNewModule] = useState("");
  const [editorState, setEditorState] = useState<{ open: boolean; moduleId: string; lesson: any | null; nextOrder: number }>({
    open: false, moduleId: "", lesson: null, nextOrder: 0,
  });
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const deleteLesson = async (l: any) => {
    if (l.video_storage_path) {
      await supabase.storage.from("lesson-videos").remove([l.video_storage_path]).catch(() => {});
    }
    await supabase.from("lessons").delete().eq("id", l.id);
    toast({ title: "Lesson deleted" });
    onRefresh();
  };

  const duplicateLesson = async (l: any) => {
    const lessons = modules.find((m) => m.id === l.module_id)?.lessons || [];
    await supabase.from("lessons").insert({
      module_id: l.module_id, title: `${l.title} (copy)`, description: l.description,
      content: l.content, duration_minutes: l.duration_minutes, order_index: lessons.length,
      status: "draft", video_url: l.video_url, auto_complete_on_watch: l.auto_complete_on_watch,
    });
    toast({ title: "Lesson duplicated" });
    onRefresh();
  };

  const handleModuleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIdx, newIdx);
    // Persist new order_index for each
    await Promise.all(reordered.map((m, i) => supabase.from("modules").update({ order_index: i }).eq("id", m.id)));
    onRefresh();
  };

  const handleLessonDragEnd = (moduleId: string, lessons: any[]) => async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIdx, newIdx);
    await Promise.all(reordered.map((l, i) => supabase.from("lessons").update({ order_index: i }).eq("id", l.id)));
    onRefresh();
  };

  const toggleSelect = (lessonId: string) => {
    setSelectedLessons((s) => {
      const next = new Set(s);
      if (next.has(lessonId)) next.delete(lessonId); else next.add(lessonId);
      return next;
    });
  };

  const bulkSetStatus = async (status: "published" | "draft") => {
    if (selectedLessons.size === 0) return;
    await supabase.from("lessons").update({ status }).in("id", Array.from(selectedLessons));
    toast({ title: `${selectedLessons.size} lesson(s) ${status === "published" ? "published" : "set to draft"}` });
    setSelectedLessons(new Set());
    onRefresh();
  };

  const bulkDelete = async () => {
    if (selectedLessons.size === 0) return;
    const ids = Array.from(selectedLessons);
    // Cleanup videos
    const { data } = await supabase.from("lessons").select("video_storage_path").in("id", ids);
    const paths = (data || []).map((d: any) => d.video_storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("lesson-videos").remove(paths).catch(() => {});
    await supabase.from("lessons").delete().in("id", ids);
    toast({ title: `${ids.length} lesson(s) deleted` });
    setSelectedLessons(new Set());
    onRefresh();
  };

  const allLessons = modules.flatMap((m) => m.lessons || []);

  return (
    <div className="space-y-4">
      {selectedLessons.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
          <span className="text-xs text-foreground">{selectedLessons.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkSetStatus("published")}>
            <Eye className="h-3 w-3 mr-1" /> Publish
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkSetStatus("draft")}>
            <EyeOff className="h-3 w-3 mr-1" /> Unpublish
          </Button>
          <ConfirmDelete
            onConfirm={bulkDelete}
            label={`Delete ${selectedLessons.size} lesson(s)?`}
            description="This will also remove uploaded videos. Cannot be undone."
            trigger={
              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            }
          />
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelectedLessons(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((mod) => (
            <SortableModule key={mod.id} id={mod.id}>
              {(dragProps) => (
                <div className="rounded-lg border border-border/50 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button {...dragProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" type="button">
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-foreground truncate">{mod.title}</span>
                      <span className="text-[10px] text-muted-foreground">{(mod.lessons || []).length} lessons</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditorState({ open: true, moduleId: mod.id, lesson: null, nextOrder: (mod.lessons || []).length })}>
                        <Plus className="h-3 w-3 mr-1" /> Lesson
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => deleteModule(mod.id)}
                        label={`Delete module "${mod.title}"?`}
                        description="All lessons inside will also be removed."
                        trigger={
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        }
                      />
                    </div>
                  </div>

                  {(mod.lessons || []).length > 0 && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd(mod.id, mod.lessons)}>
                      <SortableContext items={(mod.lessons || []).map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="mt-2 space-y-1">
                          {(mod.lessons || []).map((l: any) => (
                            <SortableLesson key={l.id} id={l.id}>
                              {(dragProps) => (
                                <div className="flex items-center justify-between gap-2 rounded border border-border/30 bg-card/40 pl-2 pr-1 py-1.5 text-xs">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <button {...dragProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" type="button">
                                      <GripVertical className="h-3 w-3" />
                                    </button>
                                    <Checkbox
                                      checked={selectedLessons.has(l.id)}
                                      onCheckedChange={() => toggleSelect(l.id)}
                                      className="h-3.5 w-3.5"
                                    />
                                    <Play className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="text-foreground truncate">{l.title}</span>
                                    {l.status === "draft" ? (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0">Draft</Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0">Live</Badge>
                                    )}
                                    {l.video_storage_path && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1 py-0">Upload</Badge>}
                                    {!l.video_storage_path && l.video_url && <Badge variant="outline" className="text-[9px] px-1 py-0">URL</Badge>}
                                    <span className="text-muted-foreground shrink-0">{l.duration_minutes || 0}m</span>
                                  </div>
                                  <div className="flex gap-0.5 shrink-0">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditorState({ open: true, moduleId: mod.id, lesson: l, nextOrder: l.order_index })}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateLesson(l)} title="Duplicate">
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <ConfirmDelete
                                      onConfirm={() => deleteLesson(l)}
                                      label={`Delete lesson "${l.title}"?`}
                                      description="Video and attachments will be removed."
                                      trigger={
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </SortableLesson>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              )}
            </SortableModule>
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Input placeholder="New module name" value={newModule} onChange={(e) => setNewModule(e.target.value)} className="h-8 text-xs" />
        <Button size="sm" className="h-8 text-xs" onClick={addModule}><Plus className="h-3 w-3 mr-1" /> Module</Button>
      </div>

      <LessonEditor
        open={editorState.open}
        onOpenChange={(v) => setEditorState((s) => ({ ...s, open: v }))}
        lesson={editorState.lesson}
        moduleId={editorState.moduleId}
        nextOrderIndex={editorState.nextOrder}
        prerequisiteOptions={allLessons.map((l) => ({ id: l.id, title: l.title }))}
        onSaved={onRefresh}
      />
    </div>
  );
}

/* ── Confirm Delete helper ── */
function ConfirmDelete({
  onConfirm, label, description, trigger,
}: { onConfirm: () => void; label: string; description?: string; trigger?: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── Learning Path Manager (unchanged) ── */
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
              <ConfirmDelete onConfirm={() => deletePath(p.id)} label={`Delete path "${p.title}"?`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Course Analytics with video metrics ── */
function CourseAnalytics() {
  const [stats, setStats] = useState<any[]>([]);
  const [lessonStats, setLessonStats] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: courses }, { data: enrollments }, { data: purchases }, { data: lessons }, { data: watch }] = await Promise.all([
        supabase.from("courses").select("id, title, price, is_paid"),
        supabase.from("course_enrollments").select("course_id, completed"),
        supabase.from("course_purchases").select("course_id, amount, payment_status"),
        supabase.from("lessons").select("id, title, module_id, modules(course_id, courses(title))"),
        supabase.from("video_watch_history").select("lesson_id, watch_count, watched_percentage"),
      ]);
      const courseStats = (courses || []).map((c) => {
        const courseEnroll = (enrollments || []).filter((e) => e.course_id === c.id);
        const completed = courseEnroll.filter((e) => e.completed).length;
        const revenue = (purchases || []).filter((p) => p.course_id === c.id && p.payment_status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
        return { ...c, enrollments: courseEnroll.length, completionRate: courseEnroll.length > 0 ? Math.round((completed / courseEnroll.length) * 100) : 0, revenue };
      });
      setStats(courseStats);

      const watchByLesson: Record<string, { views: number; sumPct: number; count: number }> = {};
      let viewsTotal = 0;
      (watch || []).forEach((w: any) => {
        viewsTotal += w.watch_count || 0;
        const e = watchByLesson[w.lesson_id] || { views: 0, sumPct: 0, count: 0 };
        e.views += w.watch_count || 0;
        e.sumPct += w.watched_percentage || 0;
        e.count += 1;
        watchByLesson[w.lesson_id] = e;
      });
      setTotalViews(viewsTotal);

      const enriched = (lessons || []).map((l: any) => {
        const w = watchByLesson[l.id] || { views: 0, sumPct: 0, count: 0 };
        return {
          id: l.id, title: l.title,
          course: l.modules?.courses?.title || "—",
          views: w.views,
          avgPct: w.count > 0 ? Math.round(w.sumPct / w.count) : 0,
        };
      }).sort((a, b) => b.views - a.views);
      setLessonStats(enriched);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const mostWatched = lessonStats.slice(0, 5);
  const leastWatched = lessonStats.filter((l) => l.views >= 0).slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Enrollments" value={stats.reduce((s, c) => s + c.enrollments, 0)} />
        <StatCard label="Avg Completion" value={`${stats.length > 0 ? Math.round(stats.reduce((s, c) => s + c.completionRate, 0) / stats.length) : 0}%`} />
        <StatCard label="Total Revenue" value={`€${stats.reduce((s, c) => s + c.revenue, 0).toLocaleString()}`} />
        <StatCard label="Video Views" value={totalViews} />
      </div>

      <div>
        <h4 className="font-serif text-sm font-semibold text-foreground mb-2">Courses</h4>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Course</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Enrollments</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Completion</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-xs text-foreground font-medium">{c.title}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{c.enrollments}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{c.completionRate}%</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">€{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LessonLeaderboard title="Most watched lessons" items={mostWatched} />
        <LessonLeaderboard title="Least watched lessons" items={leastWatched} />
      </div>
    </div>
  );
}

function LessonLeaderboard({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="font-serif text-sm font-semibold text-foreground mb-3">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <p className="text-foreground truncate">{l.title}</p>
                <p className="text-muted-foreground text-[10px]">{l.course}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-foreground font-medium">{l.views} views</p>
                <p className="text-muted-foreground text-[10px]">{l.avgPct}% avg</p>
              </div>
            </li>
          ))}
        </ul>
      )}
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
      <p className="mt-2 text-sm text-muted-foreground">
        Create and manage courses, modules, lessons, and learning paths. Upload videos directly or paste an external URL.
      </p>

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
