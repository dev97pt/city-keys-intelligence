import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// Legacy worker for broader browser compatibility (Safari, older Chromium).
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

export interface ExtractedPdfMeta {
  title: string;
  description: string;
  pageCount: number;
  thumbnailBlob: Blob;
  thumbnailUrl: string;
}

/** Parse a PDF File on the client: extract title, first-page text + thumbnail. */
export async function extractPdfMeta(file: File): Promise<ExtractedPdfMeta> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // --- Title ---
  let title = "";
  try {
    const meta: any = await pdf.getMetadata();
    title = (meta?.info?.Title || "").toString().trim();
  } catch {}
  if (!title) {
    title = file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
  }

  // --- First page (description + thumbnail) ---
  const firstPage = await pdf.getPage(1);

  // Description from first-page text (truncated)
  let description = "";
  try {
    const tc = await firstPage.getTextContent();
    description = tc.items
      .map((i: any) => ("str" in i ? i.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);
  } catch {}

  // Thumbnail
  const viewport = firstPage.getViewport({ scale: 1 });
  const targetWidth = 800;
  const scale = targetWidth / viewport.width;
  const scaled = firstPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext("2d")!;
  await firstPage.render({ canvasContext: ctx, viewport: scaled, canvas } as any).promise;
  const thumbnailBlob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
  );
  const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

  return { title, description, pageCount: pdf.numPages, thumbnailBlob, thumbnailUrl };
}
