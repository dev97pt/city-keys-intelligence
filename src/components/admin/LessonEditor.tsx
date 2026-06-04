import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import VideoUploader, { type VideoUploaderValue } from "./VideoUploader";
import AttachmentManager from "./AttachmentManager";
import { Save, Loader2 } from "lucide-react";

interface Lesson {
  id?: string;
  module_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  duration_minutes?: number | null;
  order_index?: number;
  status?: string;
  video_url?: string | null;
  video_storage_path?: string | null;
  video_size_bytes?: number | null;
  video_mime_type?: string | null;
  video_duration_seconds?: number | null;
  video_uploaded_at?: string | null;
  auto_complete_on_watch?: boolean;
  prerequisite_lesson_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lesson: Lesson | null;
  moduleId: string;
  nextOrderIndex: number;
  prerequisiteOptions?: { id: string; title: string }[];
  onSaved: () => void;
}

const empty = (moduleId: string, order: number): Lesson => ({
  module_id: moduleId,
  title: "",
  description: "",
  content: "",
  duration_minutes: 5,
  order_index: order,
  status: "draft",
  video_url: null,
  video_storage_path: null,
  video_size_bytes: null,
  video_mime_type: null,
  video_duration_seconds: null,
  video_uploaded_at: null,
  auto_complete_on_watch: true,
  prerequisite_lesson_id: null,
});

export default function LessonEditor({
  open, onOpenChange, lesson, moduleId, nextOrderIndex, prerequisiteOptions = [], onSaved,
}: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<Lesson>(empty(moduleId, nextOrderIndex));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      setForm(lesson ? { ...empty(moduleId, nextOrderIndex), ...lesson } : empty(moduleId, nextOrderIndex));
      setDirty(false);
      setAutosavedAt(null);
    }
  }, [open, lesson, moduleId, nextOrderIndex]);

  // Warn on unsaved close
  useEffect(() => {
    if (!open) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [open, dirty]);

  // Autosave draft every 20s when dirty AND editing an existing lesson
  useEffect(() => {
    if (!open || !form.id || !dirty) return;
    const t = setTimeout(() => { save(true); }, 20000);
    return () => clearTimeout(t);
  }, [form, dirty, open]);

  const update = <K extends keyof Lesson>(k: K, v: Lesson[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const setVideo = (v: VideoUploaderValue) => {
    setForm((f) => ({
      ...f,
      ...v,
      // For URL mode auto-derive duration_minutes if missing
      duration_minutes:
        v.video_duration_seconds && (!f.duration_minutes || f.duration_minutes === 5)
          ? Math.max(1, Math.round(v.video_duration_seconds / 60))
          : f.duration_minutes,
    }));
    setDirty(true);
  };

  const save = async (isAutosave = false) => {
    if (!form.title.trim()) {
      if (!isAutosave) toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        module_id: form.module_id,
        title: form.title.trim(),
        description: form.description || null,
        content: form.content || null,
        duration_minutes: form.duration_minutes || null,
        order_index: form.order_index ?? nextOrderIndex,
        status: form.status || "draft",
        video_url: form.video_url || null,
        video_storage_path: form.video_storage_path || null,
        video_size_bytes: form.video_size_bytes || null,
        video_mime_type: form.video_mime_type || null,
        video_duration_seconds: form.video_duration_seconds || null,
        video_uploaded_at: form.video_uploaded_at || null,
        auto_complete_on_watch: form.auto_complete_on_watch ?? true,
        prerequisite_lesson_id: form.prerequisite_lesson_id || null,
      };

      if (form.id) {
        await supabase.from("lessons").update(payload).eq("id", form.id);
      } else {
        const { data } = await supabase.from("lessons").insert(payload).select("id").single();
        if (data) setForm((f) => ({ ...f, id: data.id }));
      }
      setDirty(false);
      setAutosavedAt(new Date());
      if (!isAutosave) {
        toast({ title: form.id ? "Lesson updated" : "Lesson created" });
        onSaved();
        onOpenChange(false);
      } else {
        onSaved();
      }
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const requestClose = (v: boolean) => {
    if (!v && dirty) {
      if (!confirm("You have unsaved changes. Close anyway?")) return;
    }
    onOpenChange(v);
  };

  const videoValue: VideoUploaderValue = {
    mode: form.video_storage_path ? "upload" : "url",
    video_url: form.video_url || null,
    video_storage_path: form.video_storage_path || null,
    video_size_bytes: form.video_size_bytes || null,
    video_mime_type: form.video_mime_type || null,
    video_duration_seconds: form.video_duration_seconds || null,
    video_uploaded_at: form.video_uploaded_at || null,
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{form.id ? "Edit lesson" : "New lesson"}</DialogTitle>
          <DialogDescription>
            Configure video, content, attachments, and publishing.
            {autosavedAt && <span className="ml-2 text-emerald-400 text-xs">Autosaved {autosavedAt.toLocaleTimeString()}</span>}
            {dirty && <span className="ml-2 text-amber-400 text-xs">Unsaved changes</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="h-9 mt-1" maxLength={200} />
          </div>

          <div>
            <Label className="text-xs">Short description</Label>
            <Input value={form.description || ""} onChange={(e) => update("description", e.target.value)} className="h-9 mt-1" maxLength={300} />
          </div>

          <div>
            <Label className="text-xs">Video</Label>
            <div className="mt-1">
              <VideoUploader value={videoValue} onChange={setVideo} lessonHint={form.title || "Video"} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Lesson content</Label>
            <Textarea
              value={form.content || ""}
              onChange={(e) => update("content", e.target.value)}
              className="mt-1 min-h-[120px] text-sm"
              maxLength={10000}
              placeholder="Rich text / markdown-style notes for the lesson…"
            />
          </div>

          {form.id && (
            <div className="rounded-lg border border-border bg-secondary/10 p-3">
              <AttachmentManager lessonId={form.id} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={form.duration_minutes || ""}
                onChange={(e) => update("duration_minutes", parseInt(e.target.value) || 0)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                min={0}
                value={form.order_index ?? 0}
                onChange={(e) => update("order_index", parseInt(e.target.value) || 0)}
                className="h-9 mt-1"
              />
            </div>
          </div>

          {prerequisiteOptions.length > 0 && (
            <div>
              <Label className="text-xs">Prerequisite lesson (must complete first)</Label>
              <select
                value={form.prerequisite_lesson_id || ""}
                onChange={(e) => update("prerequisite_lesson_id", e.target.value || null)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {prerequisiteOptions.filter((o) => o.id !== form.id).map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.status === "published"}
                onCheckedChange={(v) => update("status", v ? "published" : "draft")}
              />
              <Label className="text-xs">
                {form.status === "published" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.auto_complete_on_watch ?? true}
                onCheckedChange={(v) => update("auto_complete_on_watch", v)}
              />
              <Label className="text-xs">Auto-complete at 90% watched</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => requestClose(false)}>Cancel</Button>
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {form.id ? "Save changes" : "Create lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
