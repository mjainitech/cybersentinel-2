import { Hash, TrendingUp, ShieldQuestion, Activity } from "lucide-react";
import { Card } from "@/components/Card";
import type { ScanHistoryStats } from "@/services/scanHistoryService";

interface ScanHistoryStatsBarProps {
  stats: ScanHistoryStats;
}

const bandLabel: Record<string, string> = { safe: "Safe", warning: "Use Caution", danger: "Dangerous" };
const bandColor: Record<string, string> = { safe: "#22D3B8", warning: "#F5A623", danger: "#EF5A5A" };

/** Four at-a-glance stats above the scan history list. */
export function ScanHistoryStatsBar({ stats }: ScanHistoryStatsBarProps) {
  const items = [
    { icon: Hash, label: "Total scans", value: String(stats.total) },
    { icon: TrendingUp, label: "Average score", value: String(stats.averageScore) },
    {
      icon: ShieldQuestion,
      label: "Most common risk",
      value: stats.mostCommonBand ? bandLabel[stats.mostCommonBand] : "—",
      color: stats.mostCommonBand ? bandColor[stats.mostCommonBand] : undefined,
    },
    { icon: Activity, label: "Last 7 days", value: String(stats.recentActivity) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4" glass>
          <div className="flex items-center gap-2 text-ink-faint">
            <item.icon className="h-3.5 w-3.5" />
            <span className="text-xs">{item.label}</span>
          </div>
          <p className="mt-1.5 font-display text-xl font-semibold" style={{ color: item.color }}>
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
