export type VideoEmbed =
  | { ok: true; platform: "youtube" | "vimeo" | "other"; embedUrl: string; videoId?: string }
  | { ok: false; message: string };

export function parseVideoEmbed(rawUrl: string): VideoEmbed {
  const url = (rawUrl || "").trim();
  if (!url) return { ok: false, message: "Please enter a video URL." };

  try {
    // YouTube
    const yt = url.match(
      /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)?([a-zA-Z0-9_-]{6,})/
    );
    if (yt && yt[1] && /youtu/.test(url)) {
      const id = yt[1].split(/[?&]/)[0];
      return { ok: true, platform: "youtube", videoId: id, embedUrl: `https://www.youtube.com/embed/${id}` };
    }

    // Vimeo
    const vm = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com|player\.vimeo\.com\/video)\/(?:channels\/[\w]+\/|groups\/[\w]+\/videos\/|album\/\d+\/video\/|video\/)?(\d+)/
    );
    if (vm && vm[1]) {
      return { ok: true, platform: "vimeo", videoId: vm[1], embedUrl: `https://player.vimeo.com/video/${vm[1]}` };
    }

    // Already an embed URL from another provider — allow https iframe
    if (/^https:\/\//i.test(url) && /(embed|player)/i.test(url)) {
      return { ok: true, platform: "other", embedUrl: url };
    }

    return { ok: false, message: "Unsupported URL. Paste a YouTube or Vimeo link." };
  } catch (e) {
    console.error("[videoEmbed] parse error", e);
    return { ok: false, message: "Could not parse the URL." };
  }
}
