import type { ThreatCategory, ThreatSeverity, ThreatSortBy } from "@/services/threatService";
import { CATEGORY_LABELS } from "@/services/threatService";
import { Button } from "@/components/Button";

interface ThreatFilterProps {
  category: ThreatCategory | null;
  onCategoryChange: (value: ThreatCategory | null) => void;
  severity: ThreatSeverity | null;
  onSeverityChange: (value: ThreatSeverity | null) => void;
  sortBy: ThreatSortBy;
  onSortByChange: (value: ThreatSortBy) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ThreatCategory[];
const SEVERITIES: ThreatSeverity[] = ["low", "medium", "high", "critical"];
const SORT_OPTIONS: { value: ThreatSortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most-severe", label: "Most Severe" },
  { value: "recently-updated", label: "Recently Updated" },
];

export function ThreatFilter({
  category,
  onCategoryChange,
  severity,
  onSeverityChange,
  sortBy,
  onSortByChange,
}: ThreatFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant={category === null ? "secondary" : "outline"} size="sm" onClick={() => onCategoryChange(null)}>
          All Categories
        </Button>
        {CATEGORIES.map((c) => (
          <Button key={c} variant={category === c ? "secondary" : "outline"} size="sm" onClick={() => onCategoryChange(c)}>
            {CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant={severity === null ? "secondary" : "outline"} size="sm" onClick={() => onSeverityChange(null)}>
            All Severities
          </Button>
          {SEVERITIES.map((s) => (
            <Button
              key={s}
              variant={severity === s ? "secondary" : "outline"}
              size="sm"
              onClick={() => onSeverityChange(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="threat-sort" className="text-xs text-ink-faint">
            Sort by
          </label>
          <select
            id="threat-sort"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as ThreatSortBy)}
            className="rounded-lg border border-base-border bg-base-surface px-3 py-1.5 text-xs text-ink focus:border-accent-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
