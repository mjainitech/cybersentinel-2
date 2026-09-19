import { Fragment } from "react";
import type { EmailIndicator } from "@/services/emailAnalysisService";
import { Tooltip } from "@/components/Tooltip";

interface EmailContentHighlighterProps {
  text: string;
  indicators: EmailIndicator[];
}

const severityColor: Record<EmailIndicator["severity"], string> = {
  low: "#4F7CFF",
  medium: "#F5A623",
  high: "#EF5A5A",
};

interface MergedSegment {
  start: number;
  end: number;
  explanations: string[];
  maxSeverity: EmailIndicator["severity"];
}

const SEVERITY_RANK: Record<EmailIndicator["severity"], number> = { low: 0, medium: 1, high: 2 };

/** Merges overlapping/adjacent indicator spans into non-overlapping segments, combining their explanations. */
function mergeIndicatorSpans(indicators: EmailIndicator[]): MergedSegment[] {
  const spans = indicators
    .filter((indicator) => typeof indicator.index === "number" && typeof indicator.length === "number")
    .map((indicator) => ({
      start: indicator.index!,
      end: indicator.index! + indicator.length!,
      explanation: `${indicator.label}: ${indicator.explanation}`,
      severity: indicator.severity,
    }))
    .sort((a, b) => a.start - b.start);

  const merged: MergedSegment[] = [];

  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
      last.explanations.push(span.explanation);
      if (SEVERITY_RANK[span.severity] > SEVERITY_RANK[last.maxSeverity]) last.maxSeverity = span.severity;
    } else {
      merged.push({ start: span.start, end: span.end, explanations: [span.explanation], maxSeverity: span.severity });
    }
  }

  return merged;
}

/**
 * Renders the analyzed email text as plain paragraphs with suspicious
 * spans wrapped in a colored, tooltip-explained <mark>. Indicators
 * without a specific text offset (e.g. sender/domain mismatches,
 * which describe the email as a whole rather than one phrase) aren't
 * highlighted here — they still appear in the indicators list elsewhere.
 */
export function EmailContentHighlighter({ text, indicators }: EmailContentHighlighterProps) {
  const segments = mergeIndicatorSpans(indicators);

  if (segments.length === 0) {
    return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-muted">{text}</pre>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  segments.forEach((segment, i) => {
    if (segment.start > cursor) {
      parts.push(<Fragment key={`plain-${i}`}>{text.slice(cursor, segment.start)}</Fragment>);
    }

    const color = severityColor[segment.maxSeverity];
    parts.push(
      <Tooltip key={`mark-${i}`} content={segment.explanations.join(" ")}>
        <mark
          className="cursor-help rounded px-0.5"
          style={{ backgroundColor: `${color}26`, color, textDecoration: "underline", textDecorationStyle: "dotted" }}
        >
          {text.slice(segment.start, segment.end)}
        </mark>
      </Tooltip>
    );

    cursor = segment.end;
  });

  if (cursor < text.length) {
    parts.push(<Fragment key="plain-end">{text.slice(cursor)}</Fragment>);
  }

  return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-muted">{parts}</pre>;
}
