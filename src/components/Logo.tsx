import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * CyberSentinel mark: a shield built from two overlapping strokes,
 * echoing the "scan" motif used across the hero and feature cards.
 * Kept as inline SVG (no asset file) so it inherits currentColor.
 */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M14 2L25 6.5V13.5C25 20.5 20 25 14 26.5C8 25 3 20.5 3 13.5V6.5L14 2Z"
          fill="url(#logo-gradient)"
          fillOpacity="0.16"
          stroke="url(#logo-gradient)"
          strokeWidth="1.6"
        />
        <path
          d="M9.5 14L12.5 17L18.5 10.5"
          stroke="url(#logo-gradient)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="3" y1="2" x2="25" y2="26.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F7CFF" />
            <stop offset="1" stopColor="#22D3B8" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          CyberSentinel
        </span>
      )}
    </div>
  );
}
