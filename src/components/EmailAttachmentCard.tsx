import { Paperclip, Construction, AlertTriangle } from "lucide-react";
import type { EmailAttachmentInfo } from "@/services/emailAnalysisService";
import { formatFileSize } from "@/services/resumeScanService";

interface EmailAttachmentCardProps {
  attachment: EmailAttachmentInfo;
}

/**
 * Shows only what we can honestly determine from a filename: type,
 * size, and pattern-based red flags (executable extensions, double
 * extensions). This never scans the file's actual contents for
 * malware — that's explicitly labeled as a future enhancement rather
 * than implied to already work.
 */
export function EmailAttachmentCard({ attachment }: EmailAttachmentCardProps) {
  return (
    <div className="rounded-xl border border-base-border bg-base-elevated/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
          <Paperclip className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink" title={attachment.filename}>
            {attachment.filename}
          </p>
          <p className="text-xs text-ink-faint">
            {attachment.fileType} · {formatFileSize(attachment.fileSize)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {attachment.riskIndicators.map((risk, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-ink-muted">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-warning" />
            <span>{risk}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-base-border bg-base-surface p-2.5 text-xs text-ink-faint">
        <Construction className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Scanning the file's actual contents for malware isn't available yet — this is a planned future enhancement.</span>
      </div>
    </div>
  );
}
