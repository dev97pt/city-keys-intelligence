import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Film, Link2, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseVideoEmbed } from "@/lib/videoEmbed";

export const ACCEPTED_VIDEO = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-m4v"];
export const ACCEPTED_EXT = [".mp4", ".mov", ".avi", ".webm", ".m4v"];
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

export interface VideoUploaderValue {
  mode: "upload" | "url";
  video_url: string | null;
  video_storage_path: string | null;
  video_size_bytes: number | null;
  video_mime_type: string | null;
  video_duration_seconds: number | null;
  video_uploaded_at: string | null;
}

interface Props {
  value: VideoUploaderValue;
  onChange: (v: VideoUploaderValue) => void;
  lessonHint?: string;
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDuration(s?: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

async function probeVideo(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

export default function VideoUploader({ value, onChange, lessonHint }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Build preview URL whenever storage path changes
  useEffect(() => {
    let active = true;
    (async () => {
      if (value.mode === "upload" && value.video_storage_path) {
        const { data } = await supabase.storage
          .from("lesson-videos")
          .createSignedUrl(value.video_storage_path, 3600);
        if (active) setPreviewUrl(data?.signedUrl || null);
      } else {
        setPreviewUrl(null);
      }
    })();
    return () => { active = false; };
  }, [value.mode, value.video_storage_path]);

  const validateFile = (file: File): string | null => {
    const ok = ACCEPTED_VIDEO.includes(file.type) || ACCEPTED_EXT.some((e) => file.name.toLowerCase().endsWith(e));
    if (!ok) return `Unsupported format. Use ${ACCEPTED_EXT.join(", ")}`;
    if (file.size > MAX_VIDEO_BYTES) return `File too large. Max 500 MB (got ${fmtSize(file.size)})`;
    return null;
  };

  const handleFile = async (file: File) => {
    const err = validateFile(file);
    if (err) {
      toast({ title: "Upload failed", description: err, variant: "destructive" });
      return;
    }

    cancelRef.current = false;
    setCancelled(false);
    setUploading(true);
    setProgress(0);

    try {
      const duration = await probeVideo(file);
      if (cancelRef.current) throw new Error("cancelled");

      const ext = file.name.split(".").pop() || "mp4";
      const path = `lessons/${crypto.randomUUID()}.${ext}`;

      // Supabase JS doesn't expose progress directly; fake smooth progress while uploading.
      const fakeTimer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 2 : p));
      }, 300);

      const { error } = await supabase.storage
        .from("lesson-videos")
        .upload(path, file, { contentType: file.type, upsert: false });

      clearInterval(fakeTimer);
      if (cancelRef.current) {
        await supabase.storage.from("lesson-videos").remove([path]).catch(() => {});
        throw new Error("cancelled");
      }
      if (error) throw error;

      setProgress(100);

      // Delete previous uploaded video if replacing
      if (value.video_storage_path && value.video_storage_path !== path) {
        await supabase.storage.from("lesson-videos").remove([value.video_storage_path]).catch(() => {});
      }

      onChange({
        mode: "upload",
        video_url: null,
        video_storage_path: path,
        video_size_bytes: file.size,
        video_mime_type: file.type || `video/${ext}`,
        video_duration_seconds: duration,
        video_uploaded_at: new Date().toISOString(),
      });

      toast({ title: "Video uploaded", description: `${file.name} (${fmtSize(file.size)})` });
    } catch (e: any) {
      if (e?.message === "cancelled") {
        setCancelled(true);
        toast({ title: "Upload cancelled" });
      } else {
        toast({ title: "Upload failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeVideo = async () => {
    if (value.video_storage_path) {
      await supabase.storage.from("lesson-videos").remove([value.video_storage_path]).catch(() => {});
    }
    onChange({
      mode: value.mode,
      video_url: null,
      video_storage_path: null,
      video_size_bytes: null,
      video_mime_type: null,
      video_duration_seconds: null,
      video_uploaded_at: null,
    });
  };

  const hasUpload = value.mode === "upload" && value.video_storage_path;
  const hasUrl = value.mode === "url" && value.video_url;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value.mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...value, mode: "upload" })}
          className="h-8 text-xs"
        >
          <Upload className="h-3 w-3 mr-1.5" /> Upload file
        </Button>
        <Button
          type="button"
          variant={value.mode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...value, mode: "url" })}
          className="h-8 text-xs"
        >
          <Link2 className="h-3 w-3 mr-1.5" /> External URL
        </Button>
      </div>

      {value.mode === "url" ? (
        <div className="space-y-2">
          <Input
            placeholder="Paste a YouTube or Vimeo URL"
            value={value.video_url || ""}
            onChange={(e) => onChange({ ...value, video_url: e.target.value, video_storage_path: null })}
            className="h-9 text-xs"
          />
          {(() => {
            const raw = value.video_url || "";
            if (!raw.trim()) {
              return (
                <p className="text-[10px] text-muted-foreground">
                  Supports youtube.com/watch, youtu.be, m.youtube.com, vimeo.com.
                </p>
              );
            }
            const parsed = parseVideoEmbed(raw);
            if (parsed.ok === false) {
              const msg = parsed.message;
              return (
                <div className="flex items-start gap-1.5 text-[10px] text-destructive">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{msg}</span>
                </div>
              );
            }
            return (
              <div className="space-y-1.5">
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {parsed.platform === "youtube" ? "YouTube" : parsed.platform === "vimeo" ? "Vimeo" : "Video file"} preview
                </p>
                <VideoPlayer externalUrl={raw} title="Video preview" />
              </div>
            );

          })()}
        </div>
      ) : hasUpload ? (
        <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0 text-xs">
                <p className="text-foreground font-medium truncate">{lessonHint || "Uploaded video"}</p>
                <p className="text-muted-foreground mt-0.5">
                  {fmtSize(value.video_size_bytes)}
                  {value.video_duration_seconds ? ` · ${fmtDuration(value.video_duration_seconds)}` : ""}
                  {value.video_uploaded_at ? ` · ${new Date(value.video_uploaded_at).toLocaleDateString()}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={removeVideo}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {previewUrl && (
            <video src={previewUrl} controls playsInline preload="metadata" className="w-full rounded-md bg-black max-h-64" />
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT.join(",")}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : uploading ? (
        <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading… {progress}%
            </span>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => (cancelRef.current = true)}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/10 hover:border-primary/40"
          }`}
        >
          <Film className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-xs font-medium text-foreground">
            Drop a video here or <span className="text-primary underline">browse</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            MP4, MOV, AVI, WEBM, M4V · max 500 MB
          </p>
          {cancelled && <p className="mt-1 text-[10px] text-destructive">Upload cancelled</p>}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT.join(",")}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {hasUrl && value.mode === "url" && (
        <p className="text-[10px] text-muted-foreground">Embed URL will be loaded in an iframe player.</p>
      )}
    </div>
  );
}
