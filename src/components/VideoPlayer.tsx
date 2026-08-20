import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { parseVideoEmbed } from "@/lib/videoEmbed";

interface Props {
  /** Signed/direct file URL for uploaded videos (takes priority). */
  fileUrl?: string | null;
  /** External URL (YouTube / Vimeo / direct mp4). */
  externalUrl?: string | null;
  title?: string;
  className?: string;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement> & {
    ref?: React.Ref<HTMLVideoElement>;
  };
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-black"
      style={{ paddingTop: "56.25%" }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>Unable to play this video: {message}</span>
    </div>
  );
}

export default function VideoPlayer({
  fileUrl,
  externalUrl,
  title = "Lesson video",
  className,
  videoProps,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // 1) Uploaded video (signed URL) — native player
  if (fileUrl) {
    return (
      <div className={className}>
        {failed ? (
          <ErrorBox message="the video file could not be loaded. The link may have expired — reload the page." />
        ) : (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-black">
            <video
              {...videoProps}
              src={fileUrl}
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              onError={() => setFailed(true)}
              className="w-full h-auto max-h-[70vh] bg-black"
            />
          </div>
        )}
      </div>
    );
  }

  if (!externalUrl?.trim()) return null;

  const parsed = parseVideoEmbed(externalUrl);
  if (parsed.ok === false) {
    return (
      <div className={className}>
        <ErrorBox message={parsed.message} />
      </div>
    );
  }

  // 2) Direct file link — native player
  if (parsed.kind === "file") {
    return (
      <div className={className}>
        {failed ? (
          <ErrorBox message="this video file format is not supported by your browser." />
        ) : (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-black">
            <video
              {...videoProps}
              src={parsed.embedUrl}
              controls
              playsInline
              preload="metadata"
              onError={() => setFailed(true)}
              className="w-full h-auto max-h-[70vh] bg-black"
            />
          </div>
        )}
      </div>
    );
  }

  // 3) YouTube / Vimeo embed.
  // NOTE: no `sandbox` attribute here — YouTube/Vimeo players require
  // same-origin script access and render a black screen when sandboxed.
  return (
    <div className={className}>
      <Frame>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          src={parsed.embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
      </Frame>
    </div>
  );
}
