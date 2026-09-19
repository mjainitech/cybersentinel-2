import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import type { ExplainRequest } from "@/services/aiCoachService";

interface AIExplainButtonProps {
  label?: string;
  explain: ExplainRequest;
  prompt: string;
}

/**
 * Drop this into any existing page's result view — it navigates to
 * the AI Security Coach with a structured explain request (never
 * arbitrary free text as "context"), which the Coach page uses to
 * build focused, authorized context server-side. This is how
 * "Explain this result" buttons throughout the app all funnel into
 * the same Coach without duplicating any explanation logic.
 */
export function AIExplainButton({ label = "Ask AI to Explain", explain, prompt }: AIExplainButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
      onClick={() => navigate("/ai-security-coach", { state: { explain, prompt } })}
    >
      {label}
    </Button>
  );
}
