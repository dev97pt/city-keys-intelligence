import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PdfViewerProps {
  url?: string | null;
  path?: string | null;
  title: string;
}

export default function PdfViewer({ url, path, title }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(url ?? null);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (url) { setResolvedUrl(url); return; }
      if (path) {
        const { data } = await supabase.storage
          .from("city-papers")
          .createSignedUrl(path, 60 * 30);
        if (!cancelled) setResolvedUrl(data?.signedUrl ?? null);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [url, path]);

  // Use Google Docs viewer as a proxy to prevent direct PDF download
  const viewerUrl = resolvedUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true`
    : "";

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border bg-card" style={{ height: "80vh" }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading document…</span>
        </div>
      )}
      {viewerUrl && (
        <iframe
          src={viewerUrl}
          title={title}
          className="w-full h-full"
          style={{ border: "none" }}
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      )}
      {/* Overlay to block right-click on the iframe area */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ pointerEvents: "none" }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
