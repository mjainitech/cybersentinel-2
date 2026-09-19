import { useState } from "react";
import type { SecurityScoreSnapshot } from "@/services/analyticsService";

interface SecurityTrendChartProps {
  snapshots: SecurityScoreSnapshot[];
}

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 12;
const MIN_POINTS = 2;

/** If fewer than two meaningful data points exist, shows an educational empty state instead of a misleading chart. */
export function SecurityTrendChart({ snapshots }: SecurityTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const scored = snapshots.filter((s) => s.overallScore !== null);

  if (scored.length < MIN_POINTS) {
    return (
      <div className="rounded-xl border border-dashed border-base-border bg-base-elevated/20 p-6 text-center text-sm text-ink-muted">
        Complete two or more security checks on different days to see your Security Score trend.
      </div>
    );
  }

  const scores = scored.map((s) => s.overallScore as number);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;

  const coords = scored.map((snapshot, index) => {
    const x = PADDING + (index / (scored.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - (((snapshot.overallScore as number) - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y, snapshot };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const first = scores[0];
  const last = scores[scores.length - 1];
  const change = last - first;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>{scored[0].date}</span>
        <span className="font-medium" style={{ color: change > 0 ? "#22D3B8" : change < 0 ? "#EF5A5A" : "#8891A5" }}>
          {change > 0 ? "+" : ""}
          {change} points over this period
        </span>
        <span>{scored[scored.length - 1].date}</span>
      </div>

      <div className="relative mt-2">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full" role="img" aria-label="Security score over time">
          <path d={pathD} fill="none" stroke="#4F7CFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === i ? 5 : 3}
              fill="#4F7CFF"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer transition-all"
            />
          ))}
        </svg>
        {hoverIndex !== null && (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-base-border bg-base-surface px-3 py-1.5 text-xs shadow-lg">
            <p className="font-medium text-ink">{coords[hoverIndex].snapshot.date}</p>
            <p className="text-ink-muted">Score: {coords[hoverIndex].snapshot.overallScore}</p>
            {coords[hoverIndex].snapshot.grade && <p className="text-ink-faint">Grade: {coords[hoverIndex].snapshot.grade}</p>}
          </div>
        )}
      </div>

      {/* Screen-reader-accessible alternative to the chart above. */}
      <table className="sr-only">
        <caption>Security score over time</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {scored.map((s) => (
            <tr key={s.id}>
              <td>{s.date}</td>
              <td>{s.overallScore}</td>
              <td>{s.grade ?? "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
