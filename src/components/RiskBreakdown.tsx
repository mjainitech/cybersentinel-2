import type { DetectedPiiItem, PiiCategory } from "@/services/resumeScanService";
import { PII_CATEGORY_LABELS } from "@/services/resumeScanService";

interface RiskBreakdownProps {
  detected: DetectedPiiItem[];
}

/**
 * Mirrors the backend's scoring weights (server/src/utils/privacyScore.ts)
 * for display only — this never computes the actual score, it just
 * explains the one the backend already returned. If the backend's
 * weights change, update both; this duplication is a deliberate,
 * low-risk tradeoff to avoid adding an API field for a purely
 * explanatory breakdown.
 */
const CATEGORY_WEIGHT: Record<PiiCategory, number> = {
  email: 3,
  phone: 3,
  linkedin: 0,
  github: 0,
  portfolio: 0,
  "personal-website": 3,
  address: 25,
  "date-of-birth": 20,
  "government-id": 40,
  "sensitive-other": 15,
};

export function RiskBreakdown({ detected }: RiskBreakdownProps) {
  const categories = Array.from(new Set(detected.map((item) => item.category))).sort(
    (a, b) => CATEGORY_WEIGHT[b] - CATEGORY_WEIGHT[a]
  );

  if (categories.length === 0) {
    return <p className="text-sm text-ink-muted">No categories contributed to a score reduction.</p>;
  }

  const maxWeight = Math.max(...categories.map((c) => CATEGORY_WEIGHT[c]), 1);

  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => {
        const weight = CATEGORY_WEIGHT[category];
        const widthPercent = weight === 0 ? 4 : Math.max(8, (weight / maxWeight) * 100);
        const color = weight === 0 ? "#22D3B8" : weight >= 20 ? "#EF5A5A" : weight >= 10 ? "#F5A623" : "#4F7CFF";

        return (
          <div key={category}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">{PII_CATEGORY_LABELS[category]}</span>
              <span className="font-mono text-ink-faint">{weight === 0 ? "No impact" : `-${weight} pts`}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-base-elevated">
              <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
