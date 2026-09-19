import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface ExpandableSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Optional short badge shown next to the title, e.g. an item count. */
  badge?: React.ReactNode;
}

/**
 * Expand/collapse wrapper for report sections. Uses Framer Motion's
 * height animation rather than the CSS grid-rows trick used elsewhere
 * (see ScanResultCard's "Learn More") because these sections hold
 * variable, often-tall content — Framer Motion measures actual
 * content height, which the pure-CSS approach can't do cleanly.
 */
export function ExpandableSection({ title, icon: Icon, children, defaultOpen = true, badge }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="surface-card overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-base-elevated/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Icon className="h-4 w-4 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-sm font-semibold text-ink">{title}</h2>
          {badge}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-base-border p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
