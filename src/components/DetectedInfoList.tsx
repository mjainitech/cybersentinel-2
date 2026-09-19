import {
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Link2,
  Cake,
  IdCard,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DetectedPiiItem, PiiCategory } from "@/services/resumeScanService";
import { PII_CATEGORY_LABELS } from "@/services/resumeScanService";
import { Tooltip } from "@/components/Tooltip";

interface DetectedInfoListProps {
  detected: DetectedPiiItem[];
}

const CATEGORY_ICONS: Record<PiiCategory, LucideIcon> = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  linkedin: Linkedin,
  github: Github,
  portfolio: Link2,
  "personal-website": Globe,
  "date-of-birth": Cake,
  "government-id": IdCard,
  "sensitive-other": ShieldAlert,
};

/** Categories that are expected/encouraged on a resume — shown with a neutral "informational" tone rather than a warning tone. */
const NEUTRAL_CATEGORIES = new Set<PiiCategory>(["email", "phone", "linkedin", "github", "portfolio"]);

const CATEGORY_GLOSSARY: Record<PiiCategory, string> = {
  phone: "A contact number — expected on a resume.",
  email: "A contact email — expected on a resume.",
  address: "A physical location — rarely needed before an interview stage.",
  linkedin: "A professional networking profile — generally fine to include.",
  github: "A code portfolio — generally fine to include, especially for technical roles.",
  portfolio: "A link to specific work samples.",
  "personal-website": "A personal site — worth double-checking what it reveals.",
  "date-of-birth": "Your birth date — a common identity-verification detail.",
  "government-id": "A government-issued ID number — highly sensitive.",
  "sensitive-other": "Something that may not need to be on a public resume.",
};

/** One row per detected item, grouped visually by whether it's expected contact info or a genuine privacy concern. */
export function DetectedInfoList({ detected }: DetectedInfoListProps) {
  if (detected.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/10 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-secondary" />
        <p className="text-sm text-ink">No personal information was detected on this resume.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {detected.map((item, index) => {
        const Icon = CATEGORY_ICONS[item.category];
        const isNeutral = NEUTRAL_CATEGORIES.has(item.category);

        return (
          <li
            key={`${item.category}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3.5"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                color: isNeutral ? "#8891A5" : "#F5A623",
                backgroundColor: isNeutral ? "rgba(136,145,165,0.12)" : "rgba(245,166,35,0.12)",
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-ink">{PII_CATEGORY_LABELS[item.category]}</p>
                <Tooltip content={CATEGORY_GLOSSARY[item.category]}>
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-base-border text-[9px] text-ink-faint">
                    i
                  </span>
                </Tooltip>
              </div>
              <p className="truncate font-mono text-xs text-ink-faint" title={item.value}>
                {item.value}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
