import { GraduationCap } from "lucide-react";

interface Topic {
  title: string;
  explanation: string;
  example: string;
  bestPractice: string;
}

const TOPICS: Topic[] = [
  {
    title: "Why password length matters",
    explanation: "Every extra character multiplies the number of possible combinations an attacker would need to try — length matters more than almost any other single factor.",
    example: "A random 8-character password has far fewer possible combinations than a random 16-character one, even using the same character types.",
    bestPractice: "Aim for at least 12–16 characters, longer where the option allows it.",
  },
  {
    title: "Password reuse",
    explanation: "Using the same password across multiple sites means a breach at any one of them puts every other account using that password at risk too.",
    example: "If your email and a shopping site share a password, a breach at the shopping site could let someone into your email as well.",
    bestPractice: "Use a unique password for every account — a password manager makes this practical.",
  },
  {
    title: "Password managers",
    explanation: "A password manager generates and stores long, unique, random passwords for every account so you don't have to remember any of them.",
    example: "Instead of memorizing 30 different passwords, you remember one strong master password that unlocks the manager.",
    bestPractice: "Choose a reputable password manager and protect it with a strong master password and MFA.",
  },
  {
    title: "Multi-factor authentication (MFA)",
    explanation: "MFA requires a second form of proof beyond your password — like a code from your phone — so a stolen password alone usually isn't enough to get in.",
    example: "Even if someone learns your password, they'd also need your phone or authenticator app to actually log in.",
    bestPractice: "Enable MFA on every account that offers it, especially email, banking, and any password manager.",
  },
  {
    title: "Credential stuffing",
    explanation: "Attackers take username/password pairs leaked in one breach and automatically try them on many other websites, betting on password reuse.",
    example: "A password leaked from an old forum breach gets tried against banking and email sites in bulk.",
    bestPractice: "Unique passwords per site make credential stuffing far less effective against you.",
  },
  {
    title: "Brute-force attacks",
    explanation: "An automated tool systematically tries huge numbers of possible passwords until one works.",
    example: "A short, simple password might be tried and matched within a practical timeframe by automated tools; a long, complex one takes vastly longer.",
    bestPractice: "Length and true randomness are your best defense against brute-force guessing.",
  },
  {
    title: "Dictionary attacks",
    explanation: "Rather than trying every possible combination, this approach tries real words and known common passwords first, since people tend to base passwords on them.",
    example: "\"sunshine1\" gets tried well before a truly random string like \"j8K#mQ2v\" would ever come up.",
    bestPractice: "Avoid basing passwords on single dictionary words, even with numbers or symbols added.",
  },
];

/** Static, evergreen password security education — the required 7 topics, each with a simple explanation, example, and best practice. */
export function PasswordEducationTopics() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 text-ink-muted">
        <GraduationCap className="h-4 w-4" />
        <p className="text-xs">Core concepts behind stronger authentication habits.</p>
      </div>
      {TOPICS.map((topic) => (
        <div key={topic.title} className="rounded-xl border border-base-border bg-base-elevated/30 p-3.5">
          <p className="text-sm font-medium text-ink">{topic.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{topic.explanation}</p>
          <p className="mt-1.5 text-xs italic leading-relaxed text-ink-faint">Example: {topic.example}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-accent-secondary">Best practice: {topic.bestPractice}</p>
        </div>
      ))}
    </div>
  );
}
