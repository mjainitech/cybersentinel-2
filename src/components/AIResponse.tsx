import { Fragment } from "react";

interface AIResponseProps {
  content: string;
}

/**
 * Renders a small, safe markdown subset (headings, bullet/numbered
 * lists, bold, inline code, code blocks) by building React elements
 * directly — text content is always placed as React children, never
 * via dangerouslySetInnerHTML, so nothing here can ever be
 * interpreted as executable HTML/script regardless of what the AI or
 * any embedded content contains.
 */
export function AIResponse({ content }: AIResponseProps) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;
  let codeBuffer: string[] | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    const items = listBuffer.items.map((item, i) => <li key={i}>{renderInline(item)}</li>);
    blocks.push(
      listBuffer.type === "ul" ? (
        <ul key={key} className="ml-4 list-disc space-y-1">
          {items}
        </ul>
      ) : (
        <ol key={key} className="ml-4 list-decimal space-y-1">
          {items}
        </ol>
      )
    );
    listBuffer = null;
  };

  lines.forEach((line, index) => {
    const key = `line-${index}`;

    if (line.trim().startsWith("```")) {
      if (codeBuffer === null) {
        codeBuffer = [];
      } else {
        blocks.push(
          <pre key={key} className="overflow-x-auto rounded-lg bg-base-elevated p-3 text-xs">
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = null;
      }
      return;
    }
    if (codeBuffer !== null) {
      codeBuffer.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      flushList(`list-before-${key}`);
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) {
        blocks.push(
          <h3 key={key} className="mt-2 font-display text-base font-semibold text-ink">
            {renderInline(text)}
          </h3>
        );
      } else if (level === 2) {
        blocks.push(
          <h4 key={key} className="mt-2 font-display text-sm font-semibold text-ink">
            {renderInline(text)}
          </h4>
        );
      } else {
        blocks.push(
          <h5 key={key} className="mt-2 text-sm font-semibold text-ink-muted">
            {renderInline(text)}
          </h5>
        );
      }
      return;
    }

    const bullet = line.match(/^[\s]*[-*]\s+(.*)/);
    if (bullet) {
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList(`list-before-${key}`);
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(bullet[1]);
      return;
    }

    const numbered = line.match(/^[\s]*\d+[.)]\s+(.*)/);
    if (numbered) {
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList(`list-before-${key}`);
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(numbered[1]);
      return;
    }

    flushList(`list-before-${key}`);

    if (line.trim() === "") {
      return;
    }

    blocks.push(
      <p key={key} className="text-sm leading-relaxed text-ink-muted">
        {renderInline(line)}
      </p>
    );
  });

  flushList("list-final");

  return <div className="flex flex-col gap-2">{blocks}</div>;
}

/** Handles inline **bold** and `code` spans within a single line — still only ever produces React elements/text, never raw HTML. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-base-elevated px-1 py-0.5 font-mono text-xs text-accent-secondary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
