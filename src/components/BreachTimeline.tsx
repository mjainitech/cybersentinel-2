import type { BreachRecord } from "@/services/breachService";

interface BreachTimelineProps {
  breaches: BreachRecord[];
}

/** A simple chronological timeline of when each breach occurred, sorted oldest to newest. */
export function BreachTimeline({ breaches }: BreachTimelineProps) {
  const sorted = [...breaches].sort((a, b) => {
    const dateA = new Date(a.breachDate).getTime();
    const dateB = new Date(b.breachDate).getTime();
    return (Number.isNaN(dateA) ? 0 : dateA) - (Number.isNaN(dateB) ? 0 : dateB);
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-ink-muted">No breaches to show on a timeline.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {sorted.map((breach, index) => (
        <li key={breach.name} className="relative flex items-start gap-3">
          {index < sorted.length - 1 && (
            <span className="absolute left-[7px] top-5 h-[calc(100%-4px)] w-px bg-base-border" />
          )}
          <span
            className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: breach.isPasswordExposed ? "#EF5A5A" : "#4F7CFF" }}
          />
          <div>
            <p className="text-sm font-medium text-ink">{breach.title}</p>
            <p className="text-xs text-ink-faint">{breach.breachDate || "Date unknown"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
