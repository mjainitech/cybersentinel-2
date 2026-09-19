import { Check, Minus } from "lucide-react";
import type { ExposureCategory as ExposureCategoryType } from "@/services/breachService";
import { EXPOSURE_CATEGORY_LABELS } from "@/services/breachService";

interface ExposureCategoryGridProps {
  categoriesFound: ExposureCategoryType[];
  categoriesNotFound: ExposureCategoryType[];
}

/**
 * Distinguishes "confirmed exposed" from "not reported as exposed" —
 * deliberately not "confirmed safe", since the absence of a category
 * in breach data doesn't prove it was never exposed anywhere. See
 * ExposureCategoryChip below for the single-category building block.
 */
export function ExposureCategoryGrid({ categoriesFound, categoriesNotFound }: ExposureCategoryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-danger">Confirmed Exposed</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {categoriesFound.length === 0 ? (
            <p className="text-xs text-ink-faint">No categories confirmed exposed.</p>
          ) : (
            categoriesFound.map((category) => <ExposureCategoryChip key={category} category={category} status="exposed" />)
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Not Reported As Exposed</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {categoriesNotFound.map((category) => (
            <ExposureCategoryChip key={category} category={category} status="not-found" />
          ))}
        </div>
        <p className="mt-2 text-[11px] italic text-ink-faint">
          This means these categories weren't found in the breaches checked — not that they're confirmed safe.
        </p>
      </div>
    </div>
  );
}

function ExposureCategoryChip({ category, status }: { category: ExposureCategoryType; status: "exposed" | "not-found" }) {
  return (
    <div
      className={
        status === "exposed"
          ? "flex items-center gap-2 rounded-lg bg-accent-danger/10 px-3 py-2 text-sm text-ink"
          : "flex items-center gap-2 rounded-lg bg-base-elevated/40 px-3 py-2 text-sm text-ink-faint"
      }
    >
      {status === "exposed" ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-accent-danger" />
      ) : (
        <Minus className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
      )}
      {EXPOSURE_CATEGORY_LABELS[category]}
    </div>
  );
}
