import { GraduationCap } from "lucide-react";

interface Topic {
  title: string;
  content: string;
}

const TOPICS: Topic[] = [
  {
    title: "What is a data breach?",
    content:
      "A data breach happens when an organization's systems are compromised and information they held about their users — like email addresses, passwords, or names — is accessed or stolen without authorization.",
  },
  {
    title: "What is credential stuffing?",
    content:
      "Attackers take username/password pairs leaked in one breach and automatically try them on many other websites, betting that people reuse passwords. This is exactly why a breach at one site can put your other accounts at risk too.",
  },
  {
    title: "Why is password reuse dangerous?",
    content:
      "If you use the same password on multiple sites, a breach at just one of them can expose every other account using that password — turning one leak into many.",
  },
  {
    title: "What is MFA?",
    content:
      "Multi-factor authentication (MFA) requires a second form of proof beyond your password — like a code from your phone — before letting someone log in. Even a stolen password usually isn't enough to get in with MFA enabled.",
  },
  {
    title: "What should I do after a breach?",
    content:
      "Change the affected account's password (and anywhere you reused it), enable MFA if you haven't, watch for suspicious login activity, and be extra cautious of phishing emails for a while afterward.",
  },
  {
    title: "What does \"no breach found\" actually mean?",
    content:
      "It means no matching record was found in the specific database checked — not that the account has definitely never been exposed anywhere. New breaches are discovered over time, and no single service covers every breach that has ever happened.",
  },
];

/** The required "Understanding Data Breaches" educational section. */
export function DataBreachEducationTopics() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 text-ink-muted">
        <GraduationCap className="h-4 w-4" />
        <p className="text-xs">Core concepts behind data breaches and how to respond to them.</p>
      </div>
      {TOPICS.map((topic) => (
        <div key={topic.title} className="rounded-xl border border-base-border bg-base-elevated/30 p-3.5">
          <p className="text-sm font-medium text-ink">{topic.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{topic.content}</p>
        </div>
      ))}
    </div>
  );
}
