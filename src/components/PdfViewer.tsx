import { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PdfViewerProps {
  /** Storage path inside the private `city-papers` bucket (preferred). */
  path?: string | null;
  /** Fallback for legacy external URLs. */
  url?: string | null;
  title: string;
}

const SIGNED_URL_TTL = 60 * 30; // 30 min

export default function PdfViewer({ path, url, title }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Resolve the source: signed URL from private bucket, or legacy URL.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const resolve = async () => {
      try {
        if (path) {
          const { data, error: err } = await supabase.storage
            .from("city-papers")
            .createSignedUrl(path, SIGNED_URL_TTL);
          if (err) throw err;
          if (!cancelled) setSignedUrl(data?.signedUrl ?? null);
        } else if (url) {
          if (!cancelled) setSignedUrl(url);
        } else {
          if (!cancelled) setError("No document available.");
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Unable to load document.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    resolve();

    return () => {
      cancelled = true;
    };
  }, [path, url]);

  // Block keyboard shortcuts for save/print while viewer is focused.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "c")) {
        e.preventDefault();
      }
    };
    const node = wrapperRef.current;
    node?.addEventListener("keydown", handler);
    return () => node?.removeEventListener("keydown", handler);
  }, []);

  // PDF.js / Chrome viewer parameters that strip the toolbar (download/print).
  const viewerSrc = signedUrl
    ? `${signedUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`
    : "";

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card text-center">
        <FileWarning className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="relative w-full rounded-xl overflow-hidden border border-border bg-card shadow-lg shadow-primary/5 select-none"
      style={{ height: "82vh" }}
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-card">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading document…</span>
        </div>
      )}

      {viewerSrc && (
        <iframe
          src={viewerSrc}
          title={title}
          className="h-full w-full"
          style={{ border: "none" }}
          onLoad={() => setLoading(false)}
        />
      )}

      {/* Invisible overlay strip at top-right blocks the browser's
          download/print buttons in case the toolbar still appears
          (Firefox honors the params less strictly). */}
      <div className="pointer-events-auto absolute right-0 top-0 z-10 h-14 w-40 bg-transparent" />

      {/* Subtle watermark to deter screen capture */}
      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
        <span className="rotate-[-30deg] select-none text-[5rem] font-serif font-semibold text-foreground/[0.04]">
          {title}
        </span>
      </div>
    </div>
  );
}
