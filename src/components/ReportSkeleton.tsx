import { cn } from "@/utils/cn";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-base-elevated", className)} />;
}

/**
 * Skeleton preview of the report layout (summary + AI card + check
 * grid) shown alongside ScanLoader so the page's final shape is
 * visible before the data arrives, rather than just a spinner.
 */
export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {/* Summary skeleton */}
      <div className="surface-card flex flex-col items-center gap-8 p-6 sm:flex-row sm:items-start sm:p-8">
        <div className="h-32 w-32 shrink-0 animate-pulse rounded-full bg-base-elevated" />
        <div className="w-full flex-1 space-y-3">
          <Bar className="h-3 w-40" />
          <Bar className="h-6 w-3/4" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-5/6" />
          <div className="flex gap-3 pt-2">
            <Bar className="h-3 w-14" />
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* AI card skeleton */}
      <div className="surface-card space-y-3 p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-base-elevated" />
          <Bar className="h-3 w-28" />
        </div>
        <Bar className="h-4 w-2/3" />
        <div className="space-y-2 pt-2">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-11/12" />
          <Bar className="h-3 w-4/5" />
        </div>
      </div>

      {/* Check grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="surface-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-base-elevated" />
              <Bar className="h-5 w-16" />
            </div>
            <Bar className="h-3.5 w-2/3" />
            <Bar className="h-3 w-1/3" />
            <Bar className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
