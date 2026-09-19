import type { SecurityAction } from "../types";
import { PRIORITY_ORDER } from "./actionPriority";

/**
 * If two candidate actions share an actionKey (e.g. "enable-mfa"
 * flagged by both the Password Center's checklist and the Security
 * Center's own recommendation), this merges them into one action
 * whose `sources` lists every system that flagged it, per the spec's
 * explicit example. The merged priority is the higher of the two —
 * if any source considers it critical, the merged action is critical,
 * never averaged down.
 */
export function deduplicateActions(candidates: SecurityAction[]): SecurityAction[] {
  const byKey = new Map<string, SecurityAction>();

  for (const candidate of candidates) {
    const existing = byKey.get(candidate.actionKey);

    if (!existing) {
      byKey.set(candidate.actionKey, candidate);
      continue;
    }

    const mergedSources = Array.from(new Set([...existing.sources, ...candidate.sources]));
    const higherPriority =
      PRIORITY_ORDER[candidate.priority] > PRIORITY_ORDER[existing.priority] ? candidate.priority : existing.priority;

    byKey.set(candidate.actionKey, { ...existing, sources: mergedSources, priority: higherPriority });
  }

  return Array.from(byKey.values());
}
