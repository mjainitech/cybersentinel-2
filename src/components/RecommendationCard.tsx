import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle, Info, ArrowRight } from "lucide-react";
import type { SecurityRecommendation } from "@/services/securityCenterService";
import { Button } from "@/components/Button";

interface RecommendationCardProps {
  recommendation: SecurityRecommendation;
  /** 1-based position, shown as a rank badge in "Your Top Security Priorities". */
  rank: number;
}

const PRIORITY_CONFIG = {
  high: { icon: AlertOctagon, color: "#EF5A5A", label: "High priority" },
  medium: { icon: AlertTriangle, color: "#F5A623", label: "Medium priority" },
  low: { icon: Info, color: "#4F7CFF", label: "Low priority" },
};

export function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const { icon: Icon, color, label } = PRIORITY_CONFIG[recommendation.priority];

  return (
    <div className="surface-card flex items-start gap-3 p-4">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold"
        style={{ color, backgroundColor: `${color}1A` }}
      >
        {rank}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
          <span className="text-[11px] font-medium" style={{ color }}>
            {label}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-ink">{recommendation.text}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{recommendation.reason}</p>
      </div>
      {recommendation.actionHref && (
        <Link to={recommendation.actionHref} className="shrink-0">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Review
          </Button>
        </Link>
      )}
    </div>
  );
}
