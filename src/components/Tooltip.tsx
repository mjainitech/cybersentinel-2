import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

/**
 * Pure-CSS hover/focus tooltip — no JS positioning needed since it's
 * always anchored above its trigger. Works with keyboard focus too
 * (group-focus-within), not just mouse hover, so it's reachable via Tab.
 * Uses a named group (group/tooltip) so it doesn't clash with any
 * outer `group` already on a parent card.
 */
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 translate-y-1 rounded-lg border border-base-border bg-base-elevated px-3 py-2 text-xs leading-relaxed text-ink-muted opacity-0 shadow-soft transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100"
      >
        {content}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-base-elevated" />
      </span>
    </span>
  );
}
