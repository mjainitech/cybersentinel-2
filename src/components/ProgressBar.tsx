interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

/** A generic, reusable progress bar with a label and numeric readout — used for lesson completion, category progress, and quiz scores. */
export function ProgressBar({ label, value, max, color = "#4F7CFF" }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>{label}</span>
        <span className="font-mono text-ink-muted">
          {value}/{max}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-base-elevated"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
