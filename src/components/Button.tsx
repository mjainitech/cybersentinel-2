import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 " +
  "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cta-gradient text-white shadow-glow hover:shadow-[0_0_0_1px_rgba(79,124,255,0.25),0_12px_36px_-8px_rgba(79,124,255,0.5)] hover:-translate-y-0.5",
  secondary:
    "bg-base-elevated text-ink border border-base-border hover:bg-base-border hover:-translate-y-0.5",
  outline:
    "bg-transparent text-ink border border-base-border hover:border-accent-primary/60 hover:bg-accent-primary/5",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-base-elevated",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/**
 * Primary reusable button. Every interactive CTA in the app should
 * route through this component so hover/focus/loading states stay
 * consistent as the product grows.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
