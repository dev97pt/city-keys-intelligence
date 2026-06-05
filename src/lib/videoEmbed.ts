export type VideoEmbed =
  | { ok: true; platform: "youtube" | "vimeo"; embedUrl: string; videoId: string }
  | { ok: false; message: string };

const DANGEROUS_PROTOCOLS = /javascript:|data:|vbscript:|file:/i;
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;
const HTML_EVENT = /<script|javascript:|on\w+=|data:/i;

function isDangerous(url: string): boolean {
  const lower = url.toLowerCase();
  if (DANGEROUS_PROTOCOLS.test(lower)) return true;
  if (HTML_EVENT.test(url)) return true;
  if (CONTROL_CHARS.test(url)) return true;
  return false;
}

function cleanYouTubeId(raw: string): string | null {
  const id = raw.split(/[?&#]/)[0];
  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
  return id;
}

function cleanVimeoId(raw: string): string | null {
  const id = raw.split(/[?&#]/)[0];
  if (!/^\d{3,12}$/.test(id)) return null;
  return id;
}

export function parseVideoEmbed(rawUrl: string): VideoEmbed {
  const url = (rawUrl || "").trim();
  if (!url) return { ok: false, message: "Please enter a video URL." };
  if (isDangerous(url)) return { ok: false, message: "Invalid or unsafe URL." };

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "https:") {
      return { ok: false, message: "Only HTTPS URLs are allowed." };
    }

    // YouTube
    const ytHost = /^(www\.|m\.)?youtube\.com$/i;
    const ytBe = /^youtu\.be$/i;
    if (ytHost.test(urlObj.hostname)) {
      const id = urlObj.searchParams.get("v");
      if (id) {
        const clean = cleanYouTubeId(id);
        if (clean) {
          return {
            ok: true,
            platform: "youtube",
            videoId: clean,
            embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(clean)}`,
          };
        }
      }
      const pathMatch = urlObj.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{6,20})$/);
      if (pathMatch) {
        const clean = cleanYouTubeId(pathMatch[1]);
        if (clean) {
          return {
            ok: true,
            platform: "youtube",
            videoId: clean,
            embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(clean)}`,
          };
        }
      }
    }
    if (ytBe.test(urlObj.hostname)) {
      const pathId = urlObj.pathname.replace(/^\//, "").split(/[?&#]/)[0];
      const clean = cleanYouTubeId(pathId);
      if (clean) {
        return {
          ok: true,
          platform: "youtube",
          videoId: clean,
          embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(clean)}`,
        };
      }
    }

    // Vimeo
    const vimeoHost = /^(www\.)?vimeo\.com$/i;
    const vimeoPlayer = /^player\.vimeo\.com$/i;
    if (vimeoHost.test(urlObj.hostname)) {
      const match = urlObj.pathname.match(/^\/(\d+)$/);
      if (match) {
        const clean = cleanVimeoId(match[1]);
        if (clean) {
          return {
            ok: true,
            platform: "vimeo",
            videoId: clean,
            embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(clean)}`,
          };
        }
      }
    }
    if (vimeoPlayer.test(urlObj.hostname)) {
      const match = urlObj.pathname.match(/^\/video\/(\d+)$/);
      if (match) {
        const clean = cleanVimeoId(match[1]);
        if (clean) {
          return {
            ok: true,
            platform: "vimeo",
            videoId: clean,
            embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(clean)}`,
          };
        }
      }
    }

    return { ok: false, message: "Unsupported URL. Paste a YouTube or Vimeo link." };
  } catch {
    return { ok: false, message: "Could not parse the URL." };
  }
}
