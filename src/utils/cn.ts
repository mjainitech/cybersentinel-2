import { clsx, type ClassValue } from "clsx";

/**
 * Merges conditional class names into a single string.
 * Thin wrapper around clsx so we have one place to extend
 * (e.g. adding tailwind-merge later) without touching every component.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
