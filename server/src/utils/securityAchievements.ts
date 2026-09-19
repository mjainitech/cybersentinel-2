import type { Achievement } from "../types";

export interface AchievementInputCounts {
  websiteScans: number;
  resumeReports: number;
  emailReports: number;
  passwordReports: number;
  breachChecks: number;
  /** Now sourced from the real Learning Hub — see securityCenterController.ts. */
  lessonsCompleted: number;
}

/**
 * Every condition here is tied to a real saved result from that
 * feature's history — never to simply opening a page. "Security
 * Learner" now reflects real Learning Hub completion data.
 */
export function calculateAchievements(counts: AchievementInputCounts): Achievement[] {
  const totalActions =
    counts.websiteScans + counts.resumeReports + counts.emailReports + counts.passwordReports + counts.breachChecks;

  return [
    {
      id: "cybersentinel-beginner",
      title: "CyberSentinel Beginner",
      description: "Complete your first security check of any kind.",
      unlocked: totalActions >= 1,
    },
    {
      id: "first-website-scan",
      title: "First Website Scan",
      description: "Scan your first website with the Website Scanner.",
      unlocked: counts.websiteScans >= 1,
    },
    {
      id: "first-phishing-analysis",
      title: "First Phishing Analysis",
      description: "Analyze your first email with the Email Phishing Analyzer.",
      unlocked: counts.emailReports >= 1,
    },
    {
      id: "privacy-protector",
      title: "Privacy Protector",
      description: "Check a resume's privacy exposure with the Resume Privacy Scanner.",
      unlocked: counts.resumeReports >= 1,
    },
    {
      id: "password-defender",
      title: "Password Defender",
      description: "Save a password strength analysis in the Password Security Center.",
      unlocked: counts.passwordReports >= 1,
    },
    {
      id: "breach-watcher",
      title: "Breach Watcher",
      description: "Run your first check in the Data Breach Checker.",
      unlocked: counts.breachChecks >= 1,
    },
    {
      id: "security-learner",
      title: "Security Learner",
      description: "Complete a lesson in the Learning Hub.",
      unlocked: counts.lessonsCompleted >= 1,
    },
  ];
}
