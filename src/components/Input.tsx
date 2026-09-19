import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

/**
 * Reusable form input used across Login, Register, and future
 * dashboard forms. Handles label association, helper text, error
 * state, and an optional leading icon / trailing element (e.g. a
 * password visibility toggle) so pages never re-implement these bits.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-muted">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 text-ink-faint">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "w-full rounded-xl border bg-base-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint",
              "border-base-border transition-colors duration-150",
              "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "border-accent-danger/60 focus:ring-accent-danger/20",
              className
            )}
            {...props}
          />

          {rightElement && (
            <span className="absolute right-3.5 flex items-center text-ink-faint">
              {rightElement}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-accent-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-ink-faint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
