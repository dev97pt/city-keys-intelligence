import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// Legacy worker for broader browser compatibility (Safari, older Chromium).
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

export interface ExtractedPdfMeta {
  title: string;
  description: string;
  pageCount: number;
  /** Best-effort publication date (ISO string) parsed from PDF metadata, or null. */
  publicationDate: string | null;
  /** First detected city / country from the first page text (case-insensitive match against a provided dictionary). */
  detectedLocation: string | null;
  thumbnailBlob: Blob;
  thumbnailUrl: string;
}

// --- helpers ---------------------------------------------------------------

/** PDF date strings look like "D:20240517123045Z" or "D:20240517123045+02'00'". */
function parsePdfDate(raw?: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return null;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00"] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

interface TextItem {
  str: string;
  height: number;
  y: number;
  fontName?: string;
}

/** Pull rich first-page text grouped into visual lines (top → bottom). */
async function getStructuredFirstPageText(page: any): Promise<{ lines: TextItem[]; raw: string }> {
  const tc = await page.getTextContent();
  const items: TextItem[] = tc.items
    .filter((i: any) => "str" in i && i.str.trim())
    .map((i: any) => ({
      str: i.str,
      height: i.height || (i.transform?.[3] ?? 12),
      y: i.transform?.[5] ?? 0,
      fontName: i.fontName,
    }));

  // Group items by y-coordinate (rounded) into lines.
  const buckets = new Map<number, TextItem[]>();
  for (const it of items) {
    const key = Math.round(it.y);
    const arr = buckets.get(key) || [];
    arr.push(it);
    buckets.set(key, arr);
  }
  const lines: TextItem[] = Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0]) // top-to-bottom in PDF coords (higher y = top)
    .map(([y, arr]) => ({
      str: arr.map((a) => a.str).join(" ").replace(/\s+/g, " ").trim(),
      height: Math.max(...arr.map((a) => a.height)),
      y,
    }))
    .filter((l) => l.str.length > 0);

  const raw = items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
  return { lines, raw };
}

/** Pick the most likely title: largest font in top half, ≥ 3 chars, ≤ 120 chars. */
function pickTitleLine(lines: TextItem[]): string {
  if (!lines.length) return "";
  // Look at first 15 lines only.
  const candidates = lines.slice(0, 15).filter((l) => l.str.length >= 3 && l.str.length <= 120);
  if (!candidates.length) return "";
  // Sort by height desc; prefer earlier lines if tied.
  const sorted = [...candidates].sort((a, b) => b.height - a.height);
  // Reject lines that are all caps short marketing tags like "CONFIDENTIAL".
  const blocked = /^(CONFIDENTIAL|MEMBERS ONLY|DRAFT|PRIVATE|EMBARGOED)/i;
  const best = sorted.find((l) => !blocked.test(l.str)) || sorted[0];
  return best.str.trim();
}

function pickDescription(lines: TextItem[], title: string): string {
  // Pick the first long-ish line after the title that is not the title itself.
  const titleNorm = title.toLowerCase();
  const candidate = lines.find(
    (l) => l.str.length >= 40 && l.str.length <= 600 && !l.str.toLowerCase().includes(titleNorm)
  );
  return (candidate?.str || "").slice(0, 400);
}

function detectLocation(text: string, dictionary: string[]): string | null {
  if (!text || !dictionary.length) return null;
  const lower = text.toLowerCase();
  // Sort dictionary by length desc so multi-word names match first ("Cape Town" before "Cape").
  const sorted = [...dictionary].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (!name) continue;
    const needle = name.toLowerCase();
    // Word-boundary safe match.
    const re = new RegExp(`(^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lower)) return name;
  }
  return null;
}

// --- main API --------------------------------------------------------------

export interface ExtractOptions {
  /** Optional list of known city/country names to match against the first page text. */
  locationDictionary?: string[];
}

export async function extractPdfMeta(file: File, opts: ExtractOptions = {}): Promise<ExtractedPdfMeta> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // --- Metadata pass ---
  let metaTitle = "";
  let pubDate: string | null = null;
  try {
    const meta: any = await pdf.getMetadata();
    metaTitle = (meta?.info?.Title || "").toString().trim();
    pubDate = parsePdfDate(meta?.info?.CreationDate) || parsePdfDate(meta?.info?.ModDate);
  } catch {}

  // --- First page ---
  const firstPage = await pdf.getPage(1);
  const { lines, raw: firstPageText } = await getStructuredFirstPageText(firstPage);

  // --- Title resolution: PDF metadata → largest visual line → filename ---
  let title = metaTitle;
  if (!title || /untitled/i.test(title)) {
    const visual = pickTitleLine(lines);
    if (visual) title = visual;
  }
  if (!title) {
    title = file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
  }

  // --- Description ---
  const description = pickDescription(lines, title);

  // --- Location ---
  const detectedLocation = detectLocation(firstPageText, opts.locationDictionary || []);

  // --- Thumbnail (high resolution) ---
  const baseViewport = firstPage.getViewport({ scale: 1 });
  const targetWidth = 1200;
  const scale = (targetWidth / baseViewport.width) * (window.devicePixelRatio || 1);
  const scaled = firstPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext("2d")!;
  await firstPage.render({ canvasContext: ctx, viewport: scaled, canvas } as any).promise;
  const thumbnailBlob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
  );
  const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

  return {
    title,
    description,
    pageCount: pdf.numPages,
    publicationDate: pubDate,
    detectedLocation,
    thumbnailBlob,
    thumbnailUrl,
  };
}
