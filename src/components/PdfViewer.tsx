import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { Loader2, FileWarning, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerProps {
  path?: string | null;
  url?: string | null;
  title: string;
}

const SIGNED_URL_TTL = 60 * 30;
const READING_WIDTH = 900; // natural readable width in CSS px at zoom=1

export default function PdfViewer({ path, url, title }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const renderedPages = useRef<Set<number>>(new Set());
  const renderTaskRef = useRef<Map<number, any>>(new Map());

  // Resolve signed URL
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

    return () => { cancelled = true; };
  }, [path, url]);

  // Load PDF
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
    return () => { cancelled = true; };
  }, [signedUrl]);

  // Render a single page – sized to the available reading width
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
        const base = page.getViewport({ scale: 1 });

        // Use the scroller's actual width (minus padding) capped at READING_WIDTH
        const scrollerW = scrollerRef.current?.clientWidth ?? window.innerWidth;
        const available = Math.min(scrollerW - 32, READING_WIDTH * 1.4);
        const cssWidth = Math.min(available, READING_WIDTH) * zoom;
        const cssScale = cssWidth / base.width;
        const renderScale = cssScale * dpr;
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${base.width * cssScale}px`;
        canvas.style.height = `${base.height * cssScale}px`;
        canvas.className = "block select-none pointer-events-none";
        const ctx = canvas.getContext("2d")!;

        // set container to natural page height so layout doesn't jump
        container.style.height = `${base.height * cssScale}px`;
        container.style.width = `${base.width * cssScale}px`;

        const task = page.render({ canvasContext: ctx, viewport, canvas } as any);
        renderTaskRef.current.set(pageNum, task);
        await task.promise;

        container.innerHTML = "";
        container.appendChild(canvas);
      } catch {
        renderedPages.current.delete(pageNum);
      }
    },
    [pdfDoc, zoom]
  );

  // Re-render on zoom
  useEffect(() => {
    renderedPages.current = new Set();
    if (!pdfDoc) return;
    // Re-render currently visible pages
    pageRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight + 600) {
        renderPage(idx + 1);
      }
    });
  }, [zoom, pdfDoc, renderPage]);

  // Lazy load
  useEffect(() => {
    if (!pdfDoc || !scrollerRef.current) return;
    const root = scrollerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          if (entry.isIntersecting) {
            renderPage(pageNum);
            if (entry.intersectionRatio > 0.5) setCurrentPage(pageNum);
          }
        }
      },
      { root, rootMargin: "600px 0px", threshold: [0, 0.5, 1] }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pdfDoc, renderPage]);

  // Disable shortcuts
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

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
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
      onMouseMove={() => setToolbarVisible(true)}
      className="relative w-full bg-neutral-900 select-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* Floating toolbar */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 backdrop-blur-md px-3 py-2 shadow-2xl transition-all duration-300 ${
          toolbarVisible ? "opacity-100 bottom-6" : "opacity-0 bottom-2 pointer-events-none"
        }`}
      >
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <span className="text-xs text-white/80 tabular-nums px-2 min-w-[64px] text-center">
          {currentPage} / {pageCount || "—"}
        </span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-[11px] text-white/70 tabular-nums min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Preparing document…</span>
        </div>
      )}

      {/* Pages */}
      <div
        ref={scrollerRef}
        className={`w-full ${isFullscreen ? "h-screen overflow-y-auto" : ""} py-8 px-4`}
      >
        <div className="mx-auto flex flex-col items-center gap-6">
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              data-page={i + 1}
              ref={(el) => (pageRefs.current[i] = el)}
              className="relative bg-white shadow-2xl shadow-black/50"
              style={{ width: "min(900px, 100%)", aspectRatio: "1 / 1.414" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Watermark */}
      <div className="pointer-events-none fixed inset-0 z-[5] flex items-center justify-center">
        <span className="rotate-[-30deg] select-none text-[6rem] font-serif font-semibold text-white/[0.025]">
          {title}
        </span>
      </div>
    </div>
  );
}
