import { GraduationCap } from "lucide-react";

interface Concept {
  title: string;
  explanation: string;
  example: string;
}

const CONCEPTS: Concept[] = [
  {
    title: "Spoofed domains",
    explanation:
      "Scammers register domains that look almost identical to a real company's — swapping a letter, adding a hyphen, or using a different ending.",
    example: '"paypa1.com" or "paypal-secure-login.net" instead of the real "paypal.com".',
  },
  {
    title: "Urgency tactics",
    explanation:
      "Creating false time pressure discourages you from stopping to think or verify — the scammer wants a fast, unconsidered reaction.",
    example: '"Your account will be suspended in 24 hours unless you verify now."',
  },
  {
    title: "Social engineering",
    explanation:
      "Rather than breaking into a system, the attacker manipulates a person into voluntarily handing over access or information.",
    example: "An email pretending to be your IT department asking you to \"confirm\" your login details.",
  },
  {
    title: "Credential theft",
    explanation:
      "A fake login page that looks identical to a real one, designed purely to capture whatever username and password you type into it.",
    example: 'A link labeled "Sign in to view your document" that leads to a lookalike login page instead of the real service.',
  },
  {
    title: "Fake invoices",
    explanation:
      "An email designed to look like a routine, legitimate bill — hoping you'll pay it (or click through it) without questioning why you're receiving it.",
    example: 'An "overdue invoice" for a subscription you never signed up for, with a link to "dispute or pay".',
  },
  {
    title: "Business Email Compromise (BEC)",
    explanation:
      "An attacker impersonates a real coworker or executive — often over a compromised or lookalike account — to request a wire transfer, gift cards, or sensitive data.",
    example: '"Hey, I\'m stuck in a meeting — can you send $500 in gift cards for a client gift? I\'ll explain later."',
  },
];

/** Static, evergreen phishing education — shown regardless of what this specific email contains. */
export function PhishingEducationTips() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 text-ink-muted">
        <GraduationCap className="h-4 w-4" />
        <p className="text-xs">Common phishing tactics to recognize — not specific to this email.</p>
      </div>
      {CONCEPTS.map((concept) => (
        <div key={concept.title} className="rounded-xl border border-base-border bg-base-elevated/30 p-3.5">
          <p className="text-sm font-medium text-ink">{concept.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{concept.explanation}</p>
          <p className="mt-1.5 text-xs italic leading-relaxed text-ink-faint">Example: {concept.example}</p>
        </div>
      ))}
    </div>
  );
}
