import { Calendar, RefreshCw } from "lucide-react";

interface ThreatTimelineProps {
  publishedDate: string;
  lastUpdatedDate: string;
}

export function ThreatTimeline({ publishedDate, lastUpdatedDate }: ThreatTimelineProps) {
  const isUpdated = publishedDate !== lastUpdatedDate;

  return (
    <ol className="flex flex-col gap-4">
      <li className="relative flex items-start gap-3">
        {isUpdated && <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-base-border" />}
        <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-elevated ring-1 ring-inset ring-base-border">
          <Calendar className="h-3.5 w-3.5 text-accent-primary" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Published</p>
          <p className="text-xs text-ink-faint">{publishedDate ? new Date(publishedDate).toLocaleString() : "Unknown"}</p>
        </div>
      </li>
      {isUpdated && (
        <li className="relative flex items-start gap-3">
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-elevated ring-1 ring-inset ring-base-border">
            <RefreshCw className="h-3.5 w-3.5 text-accent-secondary" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Last Updated</p>
            <p className="text-xs text-ink-faint">{new Date(lastUpdatedDate).toLocaleString()}</p>
          </div>
        </li>
      )}
    </ol>
  );
}
