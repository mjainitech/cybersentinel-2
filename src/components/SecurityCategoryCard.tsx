import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, Circle, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SecurityCategoryResult } from "@/services/securityCenterService";
import { CATEGORY_ROUTE } from "@/services/securityCenterService";
import { Button } from "@/components/Button";

interface SecurityCategoryCardProps {
  category: SecurityCategoryResult;
}

/** Icon + color are paired so status is never conveyed by color alone — accessible to color-blind users and screen readers. */
const STATUS_CONFIG: Record<SecurityCategoryResult["status"], { icon: LucideIcon; color: string; label: string }> = {
  excellent: { icon: CheckCircle2, color: "#22D3B8", label: "Excellent" },
  good: { icon: CheckCircle2, color: "#4F7CFF", label: "Good" },
  fair: { icon: AlertTriangle, color: "#F5A623", label: "Fair" },
  "needs-attention": { icon: XCircle, color: "#EF5A5A", label: "Needs Attention" },
  "no-data": { icon: Circle, color: "#5B6479", label: "No Data Yet" },
};

export function SecurityCategoryCard({ category }: SecurityCategoryCardProps) {
  const { icon: Icon, color, label } = STATUS_CONFIG[category.status];
  const href = CATEGORY_ROUTE[category.id];

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-ink">{category.title}</h3>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ color, backgroundColor: `${color}1A` }}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </span>
      </div>

      <p className="mt-3 font-display text-2xl font-semibold" style={{ color }}>
        {category.score !== null ? `${category.score}/100` : "—"}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{category.explanation}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">{category.recommendedAction}</p>
        {href && (
          <Link to={href} className="shrink-0">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
