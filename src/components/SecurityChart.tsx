import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SecurityTrendSeries } from "@/services/securityCenterService";

interface SecurityChartProps {
  series: SecurityTrendSeries;
}

const WIDTH = 320;
const HEIGHT = 100;
const PADDING = 8;

/**
 * Renders one trend line. Trend direction is conveyed with an icon +
 * text ("65 → 82"), not color alone, and the full data series is also
 * available to screen readers via a visually-hidden table — the SVG
 * path itself is decorative (aria-hidden).
 */
export function SecurityChart({ series }: SecurityChartProps) {
  const { points, label } = series;
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;

  const coords = points.map((point, index) => {
    const x = PADDING + (index / (points.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((point.score - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "#22D3B8" : delta < 0 ? "#EF5A5A" : "#8891A5";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-ink-muted">{label}</h4>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {first} → {last}
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 h-24 w-full" aria-hidden="true">
        <path d={pathD} fill="none" stroke="#4F7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#4F7CFF" />
        ))}
      </svg>

      {/* Screen-reader-only data table — the SVG above is purely decorative. */}
      <table className="sr-only">
        <caption>{label} over time</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={index}>
              <td>{new Date(point.date).toLocaleDateString()}</td>
              <td>{point.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
