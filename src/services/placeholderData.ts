import type { LucideIcon } from "lucide-react";
import {
  ShieldAlert,
  Globe2,
  FileSearch,
  KeySquare,
  GraduationCap,
  Mail,
  Gauge,
  Bot,
  History,
  Activity,
  BarChart3,
  ListChecks,
} from "lucide-react";

/**
 * Static placeholder content for the UI shell.
 * Nothing here talks to a backend — swap these arrays out once the
 * real scanning services exist. Kept in /services so future data-fetching
 * hooks can live alongside this file with the same shape.
 */

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Present once the real tool exists; absent features render as "Coming Soon". */
  to?: string;
}

/** Cards shown on the public landing page. */
export const landingFeatures: FeatureItem[] = [
  {
    id: "phishing-detection",
    title: "AI Phishing Detection",
    description:
      "Paste any suspicious email or message and let the model flag manipulation tactics before you click.",
    icon: ShieldAlert,
  },
  {
    id: "website-scanner",
    title: "Website Scanner",
    description:
      "Check a link's reputation, certificate health, and red flags before you ever land on the page.",
    icon: Globe2,
  },
  {
    id: "resume-privacy",
    title: "Resume Privacy Checker",
    description:
      "Scan your resume for personal details that oversharing could expose to scrapers and scammers.",
    icon: FileSearch,
  },
  {
    id: "breach-checker",
    title: "Breach Checker",
    description:
      "See whether your email or accounts have surfaced in a known data breach — and what to do next.",
    icon: KeySquare,
  },
  {
    id: "learning-hub",
    title: "Security Learning Hub",
    description:
      "Short, practical lessons that turn everyday habits into real protection against common attacks.",
    icon: GraduationCap,
  },
];

/** Six large "coming soon" cards on the dashboard home. */
export const dashboardFeatures: FeatureItem[] = [
  {
    id: "website-scanner",
    title: "Website Scanner",
    description: "Analyze any URL for phishing signals, unsafe redirects, and certificate issues.",
    icon: Globe2,
    to: "/dashboard/url-scanner",
  },
  {
    id: "email-analyzer",
    title: "Email Analyzer",
    description: "Drop in a suspicious email and get a plain-language breakdown of the risk.",
    icon: Mail,
    to: "/dashboard/email-scanner",
  },
  {
    id: "resume-scanner",
    title: "Resume Scanner",
    description: "Find personal details on your resume that are safer left off a public document.",
    icon: FileSearch,
    to: "/dashboard/resume-scanner",
  },
  {
    id: "breach-checker",
    title: "Breach Checker",
    description: "Check your email addresses against known breach databases in seconds.",
    icon: ShieldAlert,
    to: "/dashboard/breach-checker",
  },
  {
    id: "password-health",
    title: "Password Health",
    description: "Get a private, on-device read on how reusable or guessable your passwords are.",
    icon: KeySquare,
    to: "/dashboard/password-center",
  },
  {
    id: "ai-assistant",
    title: "AI Security Assistant",
    description: "Ask questions about a scam, a link, or a login attempt and get a straight answer.",
    icon: Bot,
    to: "/ai-security-coach",
  },
  {
    id: "threat-intelligence",
    title: "Threat Intelligence",
    description: "Track real vulnerabilities and common attack trends, with plain-language explanations.",
    icon: Activity,
    to: "/threat-intelligence",
  },
  {
    id: "analytics",
    title: "Security Analytics",
    description: "See how your security, privacy, and learning progress have changed over time.",
    icon: BarChart3,
    to: "/analytics",
  },
];

/** Sidebar navigation for the authenticated dashboard shell. */
export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
}

export const sidebarNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard", icon: Gauge },
  { id: "action-center", label: "Action Center", to: "/action-center", icon: ListChecks },
  { id: "url-scanner", label: "URL Scanner", to: "/dashboard/url-scanner", icon: Globe2 },
  { id: "scan-history", label: "Scan History", to: "/dashboard/history", icon: History },
  { id: "email-scanner", label: "Email Scanner", to: "/dashboard/email-scanner", icon: Mail },
  { id: "resume-scanner", label: "Resume Scanner", to: "/dashboard/resume-scanner", icon: FileSearch },
  { id: "password-center", label: "Password Center", to: "/dashboard/password-center", icon: KeySquare },
  { id: "breach-checker", label: "Breach Checker", to: "/dashboard/breach-checker", icon: ShieldAlert },
  { id: "security-score", label: "Security Center", to: "/dashboard/security-score", icon: ShieldAlert },
  { id: "learning-hub", label: "Learning Hub", to: "/dashboard/learning-hub", icon: GraduationCap },
  { id: "threat-intelligence", label: "Threat Intelligence", to: "/threat-intelligence", icon: Activity },
  { id: "analytics", label: "Security Analytics", to: "/analytics", icon: BarChart3 },
  { id: "ai-security-coach", label: "AI Security Coach", to: "/ai-security-coach", icon: Bot },
  { id: "settings", label: "Settings", to: "/dashboard/settings", icon: KeySquare },
];

/** Footer link groups for the landing page. */
export const footerLinks = {
  product: [
    { label: "Phishing Detection", to: "/#features" },
    { label: "Website Scanner", to: "/#features" },
    { label: "Resume Checker", to: "/#features" },
    { label: "Breach Checker", to: "/#features" },
  ],
  company: [
    { label: "About", to: "/#" },
    { label: "Learning Hub", to: "/#" },
    { label: "Contact", to: "/#" },
  ],
  legal: [
    { label: "Privacy Policy", to: "/#" },
    { label: "Terms of Service", to: "/#" },
  ],
};
