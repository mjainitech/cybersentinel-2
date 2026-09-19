import { useNavigate } from "react-router-dom";
import { Lock, LockOpen, AlertTriangle, ScanLine } from "lucide-react";
import { Button } from "@/components/Button";
import type { ExtractedEmailLink } from "@/services/emailAnalysisService";

interface EmailLinkAnalysisListProps {
  links: ExtractedEmailLink[];
}

/**
 * Shows each extracted link with quick, locally-computed flags —
 * NOT a reputation check. Real reputation/WHOIS/malware analysis
 * already exists in the Website Scanner (VirusTotal, URLScan, WHOIS),
 * so rather than duplicating that logic here, "Analyze this link"
 * deep-links straight into it via WebsiteScannerPage's ?url= support.
 */
export function EmailLinkAnalysisList({ links }: EmailLinkAnalysisListProps) {
  const navigate = useNavigate();

  if (links.length === 0) {
    return <p className="text-sm text-ink-muted">No links were found in this email.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {links.map((link, index) => (
        <li key={index} className="flex flex-col gap-2 rounded-xl border border-base-border bg-base-elevated/30 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {link.isHttps ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-accent-secondary" />
              ) : (
                <LockOpen className="h-3.5 w-3.5 shrink-0 text-accent-danger" />
              )}
              <p className="truncate font-mono text-xs text-ink" title={link.url}>
                {link.url}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
              <span>Domain: {link.domain}</span>
              <span className="h-1 w-1 rounded-full bg-base-border" />
              <span>{link.protocol.toUpperCase()}</span>
              {(link.isShortened || link.isIpAddress) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-warning/10 px-2 py-0.5 text-accent-warning">
                  <AlertTriangle className="h-3 w-3" />
                  {link.isIpAddress ? "IP-based link" : "Shortened URL"}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            leftIcon={<ScanLine className="h-3.5 w-3.5" />}
            onClick={() => navigate(`/dashboard/url-scanner?url=${encodeURIComponent(link.url)}`)}
          >
            Analyze this link
          </Button>
        </li>
      ))}
    </ul>
  );
}
