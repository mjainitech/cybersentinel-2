import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  glass?: boolean;
}

/**
 * Generic elevated surface used for stats, form containers, and
 * anything that isn't a FeatureCard. Keeping this separate from
 * FeatureCard avoids overloading one component with two shapes.
 */
export function Card({ children, hoverable = false, glass = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        glass ? "glass-panel" : "surface-card",
        "p-6",
        hoverable &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-accent-primary/40 hover:shadow-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
