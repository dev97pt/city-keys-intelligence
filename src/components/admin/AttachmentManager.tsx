import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Trash2, Upload, Loader2, FileText, Download } from "lucide-react";

const ACCEPTED = [".pdf", ".docx", ".xlsx", ".zip", ".pptx", ".csv", ".txt"];
const MAX = 50 * 1024 * 1024; // 50 MB

interface Attachment {
  id: string;
  title: string;
  file_storage_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  order_index: number;
}

interface Props {
  lessonId: string;
}

function fmtSize(b?: number | null) {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentManager({ lessonId }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("lesson_attachments")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_index");
    setItems((data || []) as any);
  };

  useEffect(() => { load(); }, [lessonId]);

  const upload = async (file: File) => {
    if (file.size > MAX) {
      toast({ title: "File too large", description: "Max 50 MB", variant: "destructive" });
      return;
    }
    const ok = ACCEPTED.some((e) => file.name.toLowerCase().endsWith(e));
    if (!ok) {
      toast({ title: "Unsupported format", description: ACCEPTED.join(", "), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const path = `lesson-${lessonId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from("lesson-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      await supabase.from("lesson_attachments").insert({
        lesson_id: lessonId,
        title: file.name,
        file_storage_path: path,
        file_size_bytes: file.size,
        mime_type: file.type,
        order_index: items.length,
      });
      toast({ title: "Attachment added" });
      await load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (a: Attachment) => {
    await supabase.storage.from("lesson-attachments").remove([a.file_storage_path]).catch(() => {});
    await supabase.from("lesson_attachments").delete().eq("id", a.id);
    toast({ title: "Attachment removed" });
    await load();
  };

  const download = async (a: Attachment) => {
    const { data } = await supabase.storage
      .from("lesson-attachments")
      .createSignedUrl(a.file_storage_path, 3600, { download: a.title });
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" /> Attachments ({items.length})
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
          Add file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">No attachments. PDF, DOCX, XLSX, ZIP up to 50 MB.</p>
      ) : (
        <div className="space-y-1">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded border border-border/60 bg-secondary/10 px-2 py-1.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground">{a.title}</span>
                <span className="text-muted-foreground shrink-0">{fmtSize(a.file_size_bytes)}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => download(a)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => remove(a)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
