import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { Loader2, FileWarning, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerProps {
  /** Storage path inside the private `city-papers` bucket (preferred). */
  path?: string | null;
  /** Fallback: external/legacy URL. */
  url?: string | null;
  title: string;
}

const SIGNED_URL_TTL = 60 * 30;

/**
 * Premium custom PDF viewer.
 * - Renders pages to <canvas> via pdf.js (no text layer → no text selection / copy).
 * - Pulls the PDF through a private signed URL.
 * - Disables right-click, drag, copy, save / print shortcuts.
 * - Hides all browser-native PDF chrome.
 */
export default function PdfViewer({ path, url, title }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const renderedPages = useRef<Set<number>>(new Set());

  // --- Resolve signed URL --------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    renderedPages.current = new Set();

    (async () => {
      try {
        let resolved: string | null = null;
        if (path) {
          const { data, error: err } = await supabase.storage
            .from("city-papers")
            .createSignedUrl(path, SIGNED_URL_TTL);
          if (err) throw err;
          resolved = data?.signedUrl ?? null;
        } else if (url) {
          resolved = url;
        }
        if (!resolved) throw new Error("No document available.");
        if (!cancelled) setSignedUrl(resolved);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Unable to load document.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, url]);

  // --- Load PDF document ---------------------------------------------------
  useEffect(() => {
    if (!signedUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await pdfjsLib.getDocument({ url: signedUrl }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        pageRefs.current = new Array(doc.numPages).fill(null);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load PDF.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedUrl]);

  // --- Render a single page to its canvas ----------------------------------
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || renderedPages.current.has(pageNum)) return;
      renderedPages.current.add(pageNum);

      const container = pageRefs.current[pageNum - 1];
      if (!container) {
        renderedPages.current.delete(pageNum);
        return;
      }
      try {
        const page = await pdfDoc.getPage(pageNum);
        const dpr = window.devicePixelRatio || 1;
        const containerWidth = container.clientWidth;
        const base = page.getViewport({ scale: 1 });
        const cssScale = (containerWidth / base.width) * zoom;
        const renderScale = cssScale * dpr;
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${base.width * cssScale}px`;
        canvas.style.height = `${base.height * cssScale}px`;
        canvas.className = "block max-w-full mx-auto select-none pointer-events-none";
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        container.innerHTML = "";
        container.appendChild(canvas);
      } catch {
        renderedPages.current.delete(pageNum);
      }
    },
    [pdfDoc, zoom]
  );

  // --- Re-render all visible pages when zoom changes -----------------------
  useEffect(() => {
    renderedPages.current = new Set();
    if (!pdfDoc) return;
    // Render first page immediately for snappy zoom feedback.
    renderPage(1);
  }, [zoom, pdfDoc, renderPage]);

  // --- Lazy-load pages via IntersectionObserver ----------------------------
  useEffect(() => {
    if (!pdfDoc || !scrollerRef.current) return;
    const root = scrollerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          if (entry.isIntersecting) {
            renderPage(pageNum);
            // Track current page for indicator.
            if (entry.intersectionRatio > 0.5) setCurrentPage(pageNum);
          }
        }
      },
      { root, rootMargin: "400px 0px", threshold: [0, 0.5, 1] }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pdfDoc, renderPage]);

  // --- Disable save / print / copy shortcuts -------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a"].includes(k)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // --- Navigation ----------------------------------------------------------
  const scrollToPage = (pageNum: number) => {
    const el = pageRefs.current[pageNum - 1];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // --- Error state ---------------------------------------------------------
  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
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
      className={`relative w-full rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-card to-background shadow-2xl shadow-primary/5 select-none ${
        isFullscreen ? "h-screen rounded-none" : "h-[85vh]"
      }`}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* Top toolbar (custom, not browser) */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-border/50 bg-card/80 px-4 py-2 backdrop-blur-md">
        <div className="text-xs text-muted-foreground font-medium truncate max-w-[40%]">{title}</div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums px-1 min-w-[60px] text-center">
            {currentPage} / {pageCount || "—"}
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-2 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground tabular-nums min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-2 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Preparing document…</span>
          {/* Skeleton pages */}
          <div className="mt-6 flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-32 w-56 rounded-md border border-border bg-secondary/40 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pages scroller */}
      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-y-auto pt-12 pb-6 px-4 sm:px-8"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              data-page={i + 1}
              ref={(el) => (pageRefs.current[i] = el)}
              className="relative mx-auto w-full rounded-md bg-white shadow-lg shadow-black/20 overflow-hidden"
              style={{ minHeight: "60vh" }}
            >
              {/* Placeholder shimmer until the canvas mounts */}
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Watermark (deters screen capture, kept subtle) */}
      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
        <span className="rotate-[-30deg] select-none text-[5rem] font-serif font-semibold text-foreground/[0.03]">
          {title}
        </span>
      </div>

      {/* Invisible top-right strip = extra insurance against any leftover browser controls */}
      <div className="pointer-events-auto absolute right-0 top-12 z-10 h-12 w-40 bg-transparent" />
    </div>
  );
}
