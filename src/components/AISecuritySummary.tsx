import { AiExplanationCard } from "@/components/AiExplanationCard";
import type { AiExplanation } from "@/services/scanService";

interface AISecuritySummaryProps {
  summary: AiExplanation;
}

/**
 * The Security Center's AI summary uses the exact same AiExplanation
 * shape and card component the Website Scanner, Email Analyzer, and
 * Data Breach Checker already use — this is a thin named wrapper
 * rather than a duplicate implementation, per the instruction to
 * reuse existing AI infrastructure rather than rebuild it.
 */
export function AISecuritySummary({ summary }: AISecuritySummaryProps) {
  return <AiExplanationCard explanation={summary} />;
}
