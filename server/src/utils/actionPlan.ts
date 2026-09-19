import crypto from "node:crypto";
import type { BreachRecord, BreachActionItem } from "../types";

/**
 * Builds a prioritized checklist tailored to what was actually found.
 * Each item starts uncompleted — completion state is tracked
 * per-report once saved (see controllers/breachController.ts).
 */
export function buildActionPlan(breaches: BreachRecord[]): BreachActionItem[] {
  const actions: Omit<BreachActionItem, "id" | "completed">[] = [];
  const anyPasswordExposed = breaches.some((b) => b.isPasswordExposed);

  if (anyPasswordExposed) {
    actions.push({ text: "Change the password for this account immediately.", priority: "high" });
    actions.push({ text: "Change the same password anywhere else you may have reused it.", priority: "high" });
  }

  if (breaches.length > 0) {
    actions.push({ text: "Enable multi-factor authentication on this account.", priority: "high" });
    actions.push({ text: "Watch for unexpected login notifications or password-reset emails.", priority: "medium" });
    actions.push({ text: "Be cautious of phishing emails referencing this account.", priority: "medium" });
  }

  actions.push({ text: "Consider using a password manager to generate and store unique passwords.", priority: "low" });

  if (breaches.length === 0) {
    actions.push({ text: "Continue using a unique password for every account.", priority: "low" });
    actions.push({ text: "Periodically re-check this email, since new breaches are discovered over time.", priority: "low" });
  }

  return actions.map((action) => ({ ...action, id: crypto.randomUUID(), completed: false }));
}
