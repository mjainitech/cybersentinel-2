import { useRef, useState } from "react";
import { FileText, UploadCloud, Terminal, Paperclip, X } from "lucide-react";
import { Button } from "@/components/Button";
import { formatFileSize } from "@/services/resumeScanService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

export type EmailInputMethod = "text" | "headers" | "screenshot";

interface EmailInputPanelProps {
  method: EmailInputMethod;
  onMethodChange: (method: EmailInputMethod) => void;
  content: string;
  onContentChange: (value: string) => void;
  screenshotFile: File | null;
  onScreenshotSelect: (file: File | null) => void;
  attachmentFile: File | null;
  onAttachmentSelect: (file: File | null) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const METHOD_TABS: { id: EmailInputMethod; label: string; icon: typeof FileText }[] = [
  { id: "text", label: "Paste Email Text", icon: FileText },
  { id: "screenshot", label: "Upload Screenshot", icon: UploadCloud },
  { id: "headers", label: "Advanced: Headers", icon: Terminal },
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function EmailInputPanel({
  method,
  onMethodChange,
  content,
  onContentChange,
  screenshotFile,
  onScreenshotSelect,
  attachmentFile,
  onAttachmentSelect,
  onAnalyze,
  isAnalyzing,
}: EmailInputPanelProps) {
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

  const handleScreenshotFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a PNG, JPEG, or WebP image.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("That image is too large. Please upload one under 5MB.", "error");
      return;
    }
    onScreenshotSelect(file);
  };

  const canAnalyze = method === "screenshot" ? Boolean(screenshotFile) : content.trim().length > 0;

  return (
    <div className="surface-card p-6 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {METHOD_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onMethodChange(tab.id)}
            aria-pressed={method === tab.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              method === tab.id
                ? "bg-accent-primary/15 text-accent-primary ring-1 ring-inset ring-accent-primary/30"
                : "text-ink-muted hover:bg-base-elevated"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {method === "screenshot" ? (
          screenshotFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-base-border bg-base-elevated/40 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{screenshotFile.name}</p>
                <p className="text-xs text-ink-faint">{formatFileSize(screenshotFile.size)}</p>
              </div>
              <button
                onClick={() => onScreenshotSelect(null)}
                aria-label="Remove screenshot"
                className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-base-elevated hover:text-accent-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleScreenshotFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                isDragging ? "border-accent-primary/60 bg-accent-primary/5" : "border-base-border"
              )}
            >
              <UploadCloud className="h-8 w-8 text-accent-primary" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-ink">Drag and drop a screenshot here</p>
                <p className="mt-1 text-xs text-ink-faint">PNG, JPEG, or WebP — text is read automatically via OCR</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => screenshotInputRef.current?.click()}>
                Browse files
              </Button>
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleScreenshotFiles(e.target.files)}
              />
            </div>
          )
        ) : (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={
              method === "headers"
                ? "Paste raw email headers here, e.g.\nFrom: PayPal <no-reply@paypal-security.example>\nReply-To: someone@different-domain.example\nAuthentication-Results: spf=fail dkim=fail"
                : "Paste the full email text here, including the sender line if you have it..."
            }
            rows={10}
            className="w-full resize-none rounded-xl border border-base-border bg-base-surface p-4 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
        )}
      </div>

      {/* Optional attachment metadata — filename/type/size only, never the file's actual content is processed. */}
      <div className="mt-4">
        {attachmentFile ? (
          <div className="flex items-center gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3">
            <Paperclip className="h-4 w-4 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink">{attachmentFile.name}</p>
              <p className="text-[11px] text-ink-faint">{formatFileSize(attachmentFile.size)}</p>
            </div>
            <button
              onClick={() => onAttachmentSelect(null)}
              aria-label="Remove attachment"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-base-elevated hover:text-accent-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => attachmentInputRef.current?.click()}
            className="flex items-center gap-2 text-xs font-medium text-ink-faint transition-colors hover:text-accent-primary"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach the email's attachment (optional — checks filename only, not contents)
          </button>
        )}
        <input
          ref={attachmentInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onAttachmentSelect(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button size="lg" onClick={onAnalyze} isLoading={isAnalyzing} disabled={!canAnalyze} className="mt-5 w-full">
        Analyze Email
      </Button>
    </div>
  );
}
