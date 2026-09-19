import { GraduationCap } from "lucide-react";

interface Tip {
  title: string;
  why: string;
}

const TIPS: Tip[] = [
  {
    title: "A city and state is usually enough — skip the full street address.",
    why: "Employers only need enough location info to know you're commutable or open to relocating. A full address adds real-world risk without adding hiring value.",
  },
  {
    title: "Use a professional-sounding email address.",
    why: "An address like firstname.lastname@email.com looks more polished and reveals less about you personally than an old nickname-based one might.",
  },
  {
    title: "LinkedIn and GitHub links are generally good to include.",
    why: "These are curated, professional profiles you control — very different from a full home address or birth date. Including them is usually a plus, not a risk.",
  },
  {
    title: "Leave off your date of birth and age.",
    why: "Most places don't need this for hiring, and in many regions employers aren't even supposed to factor age into decisions. It's also commonly used to verify identity elsewhere, so keeping it private helps protect you generally.",
  },
  {
    title: "Never include a Social Security number or other government ID.",
    why: "No legitimate employer needs this on a resume. Requests for it this early in a hiring process are a common red flag for scams.",
  },
  {
    title: "Check what a personal website or blog reveals before linking it.",
    why: "An old blog or personal site might share more than you'd want a stranger reading your resume to know.",
  },
];

/** Static, evergreen privacy education — shown regardless of what this specific resume contains. */
export function EducationalTips() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 text-ink-muted">
        <GraduationCap className="h-4 w-4" />
        <p className="text-xs">General tips for sharing a resume safely — not specific to this file.</p>
      </div>
      {TIPS.map((tip) => (
        <div key={tip.title} className="rounded-xl border border-base-border bg-base-elevated/30 p-3.5">
          <p className="text-sm font-medium text-ink">{tip.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            <span className="font-medium text-ink-faint">Why this matters: </span>
            {tip.why}
          </p>
        </div>
      ))}
    </div>
  );
}
