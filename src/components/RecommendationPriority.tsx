import { RecommendationCard } from "@/components/RecommendationCard";
import type { SecurityRecommendation } from "@/services/securityCenterService";

interface RecommendationPriorityProps {
  recommendation: SecurityRecommendation;
  rank: number;
}

/** The Security Center already has a ranked recommendation card for this exact shape — reused here, not duplicated. */
export function RecommendationPriority({ recommendation, rank }: RecommendationPriorityProps) {
  return <RecommendationCard recommendation={recommendation} rank={rank} />;
}
