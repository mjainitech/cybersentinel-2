export type CoachTopic = "password" | "phishing" | "privacy" | "website" | "breach" | "malware" | "learning" | "threat" | "analytics";

const TOPIC_KEYWORDS: Record<CoachTopic, string[]> = {
  password: ["password", "passphrase", "mfa", "multi-factor", "2fa", "authenticator"],
  phishing: ["phishing", "phish", "scam email", "suspicious email", "smishing", "vishing", "social engineering"],
  privacy: ["privacy", "resume", "pii", "personal information", "personally identifiable"],
  website: ["website", "url", "link", "domain", "http", "https", "ssl", "certificate"],
  breach: ["breach", "leaked", "exposed", "hacked account", "compromised"],
  malware: ["malware", "virus", "ransomware", "trojan", "spyware", "worm"],
  learning: ["lesson", "learn", "learning hub", "course", "quiz"],
  threat: ["threat", "cve", "vulnerability", "exploit"],
  analytics: ["trend", "analytics", "progress over time", "score change", "improved", "declined"],
};

/**
 * Only ever points to lessons that actually exist AND are marked
 * isAvailable in the Learning Hub content library — never an
 * invented or stubbed lesson id, so "Start Lesson" always works.
 */
const TOPIC_LESSON: Partial<Record<CoachTopic, { lessonId: string; title: string }>> = {
  password: { lessonId: "multi-factor-authentication", title: "Multi-Factor Authentication" },
  phishing: { lessonId: "what-is-phishing", title: "What Is Phishing?" },
  privacy: { lessonId: "personally-identifiable-information", title: "Personally Identifiable Information" },
  website: { lessonId: "website-reputation", title: "Website Reputation" },
  breach: { lessonId: "data-breaches", title: "Data Breaches" },
  malware: { lessonId: "what-is-malware", title: "What Is Malware?" },
};

const TOPIC_TOOL: Partial<Record<CoachTopic, { label: string; href: string }>> = {
  password: { label: "Open Password Security Center", href: "/dashboard/password-center" },
  phishing: { label: "Open Email Phishing Analyzer", href: "/dashboard/email-scanner" },
  privacy: { label: "Open Resume Privacy Scanner", href: "/dashboard/resume-scanner" },
  website: { label: "Open Website Scanner", href: "/dashboard/url-scanner" },
  breach: { label: "Open Data Breach Checker", href: "/dashboard/breach-checker" },
  learning: { label: "Open Learning Hub", href: "/dashboard/learning-hub" },
  threat: { label: "Open Threat Intelligence", href: "/threat-intelligence" },
  analytics: { label: "Open Security Analytics", href: "/analytics" },
};

/** Detects every topic mentioned in a message — a question can touch more than one (e.g. "phishing and passwords"). */
export function detectTopics(message: string): CoachTopic[] {
  const lower = message.toLowerCase();
  const topics: CoachTopic[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as [CoachTopic, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) topics.push(topic);
  }

  return topics;
}

export function getRecommendedLesson(topics: CoachTopic[]): { lessonId: string; title: string } | undefined {
  for (const topic of topics) {
    const lesson = TOPIC_LESSON[topic];
    if (lesson) return lesson;
  }
  return undefined;
}

export function getRecommendedTool(topics: CoachTopic[]): { label: string; href: string } | undefined {
  for (const topic of topics) {
    const tool = TOPIC_TOOL[topic];
    if (tool) return tool;
  }
  return undefined;
}
