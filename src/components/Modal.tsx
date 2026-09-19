import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** "md" (default) fits forms and confirmations; "xl" fits larger content like a full report. */
  size?: "md" | "xl";
}

const sizeClasses = {
  md: "max-w-md",
  xl: "max-w-4xl",
};

/**
 * Generic modal shell. Pair with the useDisclosure hook:
 *   const { isOpen, open, close } = useDisclosure();
 *   <Modal isOpen={isOpen} onClose={close} title="...">...</Modal>
 */
export function Modal({ isOpen, onClose, title, children, className, size = "md" }: ModalProps) {
  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className={cn(
          "surface-card relative w-full animate-fade-up p-6 max-h-[85vh] overflow-y-auto",
          sizeClasses[size],
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-base-elevated hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
