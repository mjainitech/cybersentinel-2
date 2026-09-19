import { ImageOff } from "lucide-react";

/**
 * A genuine placeholder — no fabricated image, just a clear note that
 * this is coming later. Capturing real screenshots needs a headless
 * browser on the backend, which is a bigger addition than this pass covers.
 */
export function ScreenshotPlaceholder() {
  return (
    <div className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-border bg-base-elevated/30 p-4 text-center">
      <ImageOff className="h-5 w-5 text-ink-faint" strokeWidth={1.5} />
      <p className="text-xs text-ink-faint">Website screenshot preview coming in a future update</p>
    </div>
  );
}
