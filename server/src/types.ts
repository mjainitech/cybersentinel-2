/**
 * Types shared across backend services. `ScanCheckResult` is the API
 * contract the frontend maps into its full ScanCheck (adding an icon
 * and "Learn More" copy client-side) — see src/services/scanService.ts
 * on the frontend.
 */

export type CheckStatus = "safe" | "warning" | "danger" | "unknown";

/** Which report section a check belongs to — see utils/checkCategory.ts for the id→category mapping. */
export type CheckCategory = "connection" | "domain" | "reputation" | "technical";

export interface ScanCheckResult {
  id: string;
  title: string;
  /** Detected value at a glance, e.g. "Enabled", "3 years, 4 months". */
  value: string;
  /** One-sentence, site-specific explanation of this finding. */
  summary: string;
  status: CheckStatus;
  /** Optional structured extras a specific check wants to expose beyond value/summary — e.g. a country code for rendering a flag. */
  meta?: Record<string, string>;
  /**
   * Assigned centrally in aggregateReport.ts rather than by each check
   * service, so individual services don't need to know about report
   * layout. Optional here because it's absent until aggregation runs.
   */
  category?: CheckCategory;
}

/** A single actionable suggestion derived from the scan's actual findings — see utils/recommendations.ts. */
export interface Recommendation {
  id: string;
  /** The action itself, e.g. "Avoid entering passwords on this site." */
  text: string;
  /** Why this recommendation applies, tied to a specific finding. */
  reason: string;
  priority: Exclude<CheckStatus, "unknown">;
}

export interface AiExplanation {
  /** One-sentence plain-language verdict, e.g. "This website appears safe to visit." */
  verdict: string;
  /** Why — short, beginner-friendly sentences explaining what looked good. */
  reasons: string[];
  /** What risks (if any) were found — empty array if nothing concerning turned up. */
  risks: string[];
  /** What the user should actually do next. */
  nextSteps: string[];
  /** True when a real AI model generated this; false when it's the rule-based fallback (no API key / API failure). */
  generatedByAi: boolean;
}

export interface ScanReportMeta {
  /** True if one or more checks couldn't complete (API failure, timeout, missing key). */
  partial: boolean;
  /** ids of checks that came back "unknown" so the frontend can call them out. */
  unavailableChecks: string[];
  cached: boolean;
  cachedAt?: string;
  scannedAt: string;
}

export interface ScanReportResponse {
  url: string;
  score: number;
  band: Exclude<CheckStatus, "unknown">;
  /** Letter grade derived from score — a quick, familiar shorthand alongside the numeric score. */
  rating: "A" | "B" | "C" | "D" | "F";
  /** How much of the report could actually be verified — lower when several checks came back "unknown". */
  confidence: "high" | "medium" | "low";
  recommendation: string;
  checks: ScanCheckResult[];
  recommendations: Recommendation[];
  aiExplanation: AiExplanation;
  meta: ScanReportMeta;
}

/* -------------------------------------------------------------------- */
/* Resume Privacy Scanner                                                */
/* -------------------------------------------------------------------- */

export type PiiCategory =
  | "phone"
  | "email"
  | "address"
  | "linkedin"
  | "github"
  | "portfolio"
  | "personal-website"
  | "date-of-birth"
  | "government-id"
  | "sensitive-other";

export interface DetectedPiiItem {
  category: PiiCategory;
  label: string;
  /** The matched text — government IDs are partially masked before this ever leaves the detector. */
  value: string;
}

export type PrivacyRating = "excellent" | "good" | "needs-improvement" | "high-risk";

export interface ResumeRecommendation {
  id: string;
  text: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface ResumeAiReview {
  summary: string;
  foundInfo: string[];
  risks: string[];
  recommendations: string[];
  generatedByAi: boolean;
}

export interface ResumePrivacyReport {
  fileName: string;
  analyzedAt: string;
  privacyScore: number;
  privacyRating: PrivacyRating;
  detected: DetectedPiiItem[];
  recommendations: ResumeRecommendation[];
  aiReview: ResumeAiReview;
  /** True if pdf-parse returned little to no extractable text (e.g. a scanned/image-only PDF). */
  lowTextWarning: boolean;
}

export interface ResumeReportRecord {
  id: string;
  userId: string;
  fileName: string;
  analyzedAt: string;
  privacyScore: number;
  privacyRating: PrivacyRating;
  /** Short human-readable rollup, e.g. "3 items detected · Needs Improvement". */
  summary: string;
  report: ResumePrivacyReport;
}

export type ResumeReportSummary = Omit<ResumeReportRecord, "report">;

/* -------------------------------------------------------------------- */
/* Email Phishing Analyzer                                              */
/* -------------------------------------------------------------------- */

export type EmailIndicatorCategory =
  | "sender-mismatch"
  | "suspicious-domain"
  | "urgent-language"
  | "credential-request"
  | "payment-request"
  | "threatening-language"
  | "grammar-spelling"
  | "suspicious-link"
  | "suspicious-attachment"
  | "brand-impersonation";

export interface EmailIndicator {
  category: EmailIndicatorCategory;
  label: string;
  /** Beginner-friendly, one-sentence explanation of why this specific match was flagged. */
  explanation: string;
  severity: "low" | "medium" | "high";
  /** Character offset into the original email text, for highlighting — absent for indicators not tied to a specific span (e.g. sender mismatch). */
  index?: number;
  length?: number;
  matchedText?: string;
}

export type EmailRiskClassification = "likely-safe" | "use-caution" | "suspicious" | "likely-phishing";

export interface ExtractedEmailLink {
  url: string;
  domain: string;
  protocol: string;
  /** Lightweight, locally-computed flags — NOT a full reputation check. Use the Website Scanner for that (see "Analyze this link"). */
  isShortened: boolean;
  isIpAddress: boolean;
  isHttps: boolean;
}

export interface EmailAttachmentInfo {
  filename: string;
  fileType: string;
  fileSize: number;
  riskIndicators: string[];
}

export interface EmailAnalysisReport {
  inputMethod: "text" | "headers" | "screenshot";
  analyzedAt: string;
  riskScore: number;
  classification: EmailRiskClassification;
  indicators: EmailIndicator[];
  links: ExtractedEmailLink[];
  attachment?: EmailAttachmentInfo;
  aiExplanation: AiExplanation;
  /** The text actually analyzed (sanitized) — needed by the frontend to render highlights against the right offsets. */
  analyzedText: string;
  /** True when OCR on an uploaded screenshot produced little to no usable text. */
  lowTextWarning: boolean;
}

export interface EmailHistoryRecord {
  id: string;
  userId: string;
  analyzedAt: string;
  riskScore: number;
  classification: EmailRiskClassification;
  summary: string;
  report: EmailAnalysisReport;
}

export type EmailHistorySummary = Omit<EmailHistoryRecord, "report">;

/* -------------------------------------------------------------------- */
/* Password Security Center                                             */
/* -------------------------------------------------------------------- */
/* CRITICAL: password analysis happens entirely client-side (see the    */
/* frontend's utils/passwordAnalysis.ts) — there is deliberately no     */
/* "/api/password/analyze" endpoint, because that would mean sending a  */
/* password to this server. Everything below only ever describes the   */
/* RESULT of an analysis that already happened in the browser — never   */
/* the password itself. Do not add a password field to any of these.   */

export interface PasswordChecklistState {
  uniquePasswords: boolean;
  usesMfa: boolean;
  usesPasswordManager: boolean;
  avoidsReuse: boolean;
  checksForBreaches: boolean;
}

export interface PasswordHistoryRecord {
  id: string;
  userId: string;
  analyzedAt: string;
  /** 0-100 score computed client-side. */
  score: number;
  rating: "very-weak" | "weak" | "fair" | "strong" | "excellent";
  /** Plain-text recommendation summaries only — never the password that produced them. */
  recommendations: string[];
  checklist: PasswordChecklistState;
  checklistCompletionPercent: number;
}

export type PasswordHistorySummary = Omit<PasswordHistoryRecord, "recommendations" | "checklist">;

/* -------------------------------------------------------------------- */
/* Data Breach & Account Exposure Checker                               */
/* -------------------------------------------------------------------- */

export type ExposureCategory =
  | "email"
  | "password"
  | "phone"
  | "name"
  | "location"
  | "username"
  | "ip-address"
  | "other";

export interface BreachRecord {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  /** Deduplicated, mapped from the breach provider's free-text categories into our fixed set. */
  exposedCategories: ExposureCategory[];
  isPasswordExposed: boolean;
  isSensitive: boolean;
}

export type ExposureRiskLevel = "low" | "moderate" | "high" | "severe";

export interface ExposureRiskScore {
  score: number;
  level: ExposureRiskLevel;
  /** Plain-language breakdown of what contributed to the score, shown in "How is this score calculated?" */
  factors: string[];
}

/** A simple checklist item for the Data Breach Checker's remediation plan — distinct from the Security Action Center's much richer SecurityAction (below), which shares no shape with this one. */
export interface BreachActionItem {
  id: string;
  text: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface BreachCheckReport {
  checkedAt: string;
  breachFound: boolean;
  breaches: BreachRecord[];
  categoriesFound: ExposureCategory[];
  categoriesNotFound: ExposureCategory[];
  riskScore: ExposureRiskScore;
  aiExplanation: AiExplanation;
  actionPlan: BreachActionItem[];
  passwordsPotentiallyExposed: boolean;
}

export interface BreachHistoryRecord {
  id: string;
  userId: string;
  checkedAt: string;
  /** A masked display form only (e.g. "j***@gmail.com") — never the full email, as extra privacy-by-design margin beyond what was strictly required. */
  maskedEmail: string;
  breachCount: number;
  riskLevel: ExposureRiskLevel;
  actionPlan: BreachActionItem[];
  report: BreachCheckReport;
}

export type BreachHistorySummary = Omit<BreachHistoryRecord, "report" | "actionPlan">;

/* -------------------------------------------------------------------- */
/* CyberSentinel Security Center                                        */
/* -------------------------------------------------------------------- */

export type SecurityGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export type SecurityCategoryId =
  | "website-security"
  | "password-security"
  | "account-exposure"
  | "privacy"
  | "phishing-awareness"
  | "education";

export interface SecurityCategoryResult {
  id: SecurityCategoryId;
  title: string;
  /** False when there's no underlying activity to score yet — never a fabricated score. */
  hasData: boolean;
  /** 0-100, higher is better, only meaningful when hasData is true. */
  score: number | null;
  status: "excellent" | "good" | "fair" | "needs-attention" | "no-data";
  explanation: string;
  recommendedAction: string;
  /** Category-specific stats shown in the UI — shape varies per category, kept loose intentionally. */
  stats: Record<string, string | number | null>;
}

export interface SecurityRecommendation {
  id: string;
  text: string;
  reason: string;
  priority: "low" | "medium" | "high";
  /** Which category this recommendation stems from, so the UI can link back to the right tool. */
  category: SecurityCategoryId;
  actionHref?: string;
}

export type SecurityActivityType =
  | "website-scan"
  | "resume-analysis"
  | "phishing-analysis"
  | "password-assessment"
  | "breach-check";

export interface SecurityTimelineEntry {
  type: SecurityActivityType;
  date: string;
  label: string;
  result: string;
  riskLevel?: "safe" | "caution" | "risk";
}

export interface SecurityTrendSeries {
  category: SecurityCategoryId;
  label: string;
  /** Chronological (date, score) pairs — only included when there are enough points to be meaningful. */
  points: { date: string; score: number }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface SecurityProfileReport {
  generatedAt: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  /** How many of the 6 categories actually contributed to overallScore. */
  categoriesWithData: number;
  scoringMethodology: string[];
  categories: SecurityCategoryResult[];
  recommendations: SecurityRecommendation[];
  timeline: SecurityTimelineEntry[];
  trends: SecurityTrendSeries[];
  achievements: Achievement[];
  aiSummary: AiExplanation;
  isNewUser: boolean;
  /**
   * Informational only — deliberately NOT one of the scored
   * categories above. Viewing or bookmarking threat intelligence
   * content says nothing about whether the user's own accounts or
   * devices are actually secure, so it never contributes to overallScore.
   */
  threatIntelligence: { threatsViewed: number; threatsBookmarked: number };
}

/* -------------------------------------------------------------------- */
/* Cybersecurity Learning Hub                                            */
/* -------------------------------------------------------------------- */

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LearningCategoryId =
  | "fundamentals"
  | "online-safety"
  | "phishing-social-engineering"
  | "web-security"
  | "malware"
  | "privacy"
  | "application-security";

export interface KeyTerm {
  term: string;
  simpleExplanation: string;
  example: string;
  learnMore: string;
}

export interface QuizChoice {
  text: string;
  isCorrect: boolean;
  /** Shown after submission — explains why this specific choice is right or wrong. */
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  choices: QuizChoice[];
}

/** The version of a quiz question ever sent to the client BEFORE submission — no answer key, no explanations. */
export interface QuizQuestionPublic {
  id: string;
  question: string;
  choices: { text: string }[];
}

export interface RealWorldScenario {
  prompt: string;
  /** The learner picks one of these before seeing guidance. */
  options: string[];
  /** Index into options considered the safest response. */
  safestOptionIndex: number;
  guidance: string;
}

export interface RelatedTool {
  label: string;
  href: string;
}

export interface Lesson {
  id: string;
  categoryId: LearningCategoryId;
  title: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  /** Position within its category, for prev/next navigation and default ordering. */
  order: number;
  objectives: string[];
  explanation: string;
  examples: string[];
  keyTerms: KeyTerm[];
  whyThisMatters: string;
  scenario: RealWorldScenario;
  quiz: QuizQuestion[];
  relatedTool?: RelatedTool;
  /** False for lessons whose full content hasn't been written yet — shown as "Coming Soon" rather than left out of the path entirely. */
  isAvailable: boolean;
}

/** The sanitized shape ever sent to the client for an available lesson — quiz choices carry no answer key. */
export interface LessonPublic extends Omit<Lesson, "quiz"> {
  quiz: QuizQuestionPublic[];
}

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  lessonCount: number;
  availableLessonCount: number;
}

export type LessonStatus = "not-started" | "in-progress" | "completed";

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  completedAt?: string;
  bestQuizScore?: number;
  quizAttempts: number;
}

export interface QuizAttemptResult {
  lessonId: string;
  attemptedAt: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  isNewBest: boolean;
  /** Full grading detail — correct answers and explanations — only ever returned AFTER submission. */
  results: { questionId: string; selectedIndex: number; correctIndex: number; explanations: string[] }[];
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  /** Idempotency key — e.g. "lesson-complete:what-is-cybersecurity" — prevents awarding the same reward twice. */
  key: string;
  createdAt: string;
}

export interface LearningLevel {
  level: number;
  title: string;
  xpRequired: number;
}

export interface LearningStreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  /** ISO date strings (YYYY-MM-DD) with meaningful activity — used for the calendar visualization. */
  activityDates: string[];
}

export interface LearningAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  earnedAt?: string;
}

export interface LearningProfile {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpForNextLevel: number | null;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number | null;
  lessonsCompleted: number;
  totalAvailableLessons: number;
  completionPercent: number;
  quizzesCompleted: number;
  achievementsEarned: number;
  streak: LearningStreakState;
  categoryProgress: { categoryId: LearningCategoryId; completed: number; total: number }[];
}

/* -------------------------------------------------------------------- */
/* Threat Intelligence Dashboard                                        */
/* -------------------------------------------------------------------- */

export type ThreatCategory =
  | "phishing"
  | "malware"
  | "ransomware"
  | "data-breaches"
  | "vulnerabilities"
  | "identity-theft"
  | "social-engineering"
  | "web-security";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export interface ThreatSource {
  name: string;
  url: string;
}

/**
 * A curated threat-awareness entry (phishing trend, malware family,
 * general advisory) — NOT live-scraped. Each one cites a real,
 * legitimate public source. See data/threatContent.ts for why this is
 * curated rather than pulled live: there's no single reliable free
 * API for "current phishing trends" the way NVD exists for CVEs.
 */
export interface ThreatEntry {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  publishedDate: string;
  lastUpdatedDate: string;
  shortDescription: string;
  fullDescription: string;
  warningSigns: string[];
  protectionSteps: string[];
  source: ThreatSource;
  relatedLessonId?: string;
  relatedToolHref?: { label: string; href: string };
}

export interface CveRecord {
  id: string;
  severity: ThreatSeverity | "unknown";
  cvssScore: number | null;
  description: string;
  affectedProducts: string[];
  publishedDate: string;
  lastModifiedDate: string;
  referenceUrl: string;
}

export interface ThreatOverviewMetrics {
  threatsTracked: number;
  recentAdvisories: number;
  criticalVulnerabilities: number | null;
  recentPhishingTrends: number;
  lastUpdated: string | null;
  /** True when the live NVD-backed metrics couldn't be refreshed — the UI shows "Data temporarily unavailable" for just those, not the whole page. */
  vulnerabilityDataUnavailable: boolean;
}

export type ThreatListItem =
  | ({ kind: "curated" } & ThreatEntry)
  | ({ kind: "cve" } & CveRecord);

export interface ThreatBookmarkRecord {
  id: string;
  userId: string;
  threatId: string;
  threatKind: "curated" | "cve";
  title: string;
  category: ThreatCategory | "vulnerabilities";
  bookmarkedAt: string;
}

export interface ThreatHistoryRecord {
  id: string;
  userId: string;
  threatId: string;
  threatKind: "curated" | "cve";
  title: string;
  viewedAt: string;
}

export interface ThreatRecommendation {
  label: string;
  href: string;
}

export interface ThreatDetailResponse {
  item: ThreatListItem;
  aiExplanation: AiExplanation | null;
  recommendations: ThreatRecommendation[];
  isBookmarked: boolean;
}

/* -------------------------------------------------------------------- */
/* Security Analytics & Reporting Center                                */
/* -------------------------------------------------------------------- */

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

/**
 * A periodic snapshot of the Security Center's live-computed overall
 * score. This is what makes an honest "Security Score Trend" chart
 * possible — the Security Center itself only ever computes a live,
 * current score (see securityScore.ts), it never stored history. At
 * most one snapshot is recorded per user per day, taken as a
 * side-effect whenever the Security Center profile is freshly
 * computed (see securityCenterController.ts). New/existing users
 * will have zero snapshots until this has run for a while — the
 * empty state for that is intentional, not a bug.
 */
export interface SecurityScoreSnapshot {
  id: string;
  userId: string;
  date: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  categoryScores: Partial<Record<SecurityCategoryId, number | null>>;
}

export interface AnalyticsOverview {
  overallScore: number | null;
  scoreChange: number | null;
  totalSecurityChecks: number;
  securityChecksThisMonth: number;
  learningProgressPercent: number | null;
  openRecommendations: number;
  threatsReviewed: number;
  hasEnoughData: boolean;
}

export interface RiskDistribution {
  safe: number;
  caution: number;
  risk: number;
}

export interface WebsiteAnalytics {
  totalScanned: number;
  averageScore: number | null;
  highestRiskScan: { url: string; score: number } | null;
  lowestRiskScan: { url: string; score: number } | null;
  riskDistribution: RiskDistribution;
  trend: SecurityTrendSeries | null;
}

export interface PhishingAnalytics {
  totalAnalyzed: number;
  averageScore: number | null;
  suspiciousCount: number;
  likelyPhishingCount: number;
  riskDistribution: RiskDistribution;
  trend: SecurityTrendSeries | null;
}

export interface PasswordAnalytics {
  assessmentsCompleted: number;
  averageScore: number | null;
  trend: SecurityTrendSeries | null;
  checklistCompletionPercent: number | null;
  mfaChecked: boolean | null;
  passwordManagerChecked: boolean | null;
}

export interface PrivacyAnalytics {
  totalScans: number;
  averageScore: number | null;
  trend: SecurityTrendSeries | null;
  mostCommonFindingSummaries: string[];
}

export interface BreachAnalytics {
  totalChecks: number;
  knownExposures: number;
  mostRecentCheck: { maskedEmail: string; riskLevel: ExposureRiskLevel; checkedAt: string } | null;
  exposureCategoriesSeen: number;
}

export interface LearningAnalytics {
  lessonsCompleted: number;
  quizCompletionRate: number | null;
  averageQuizScore: number | null;
  xpEarned: number;
  currentLevel: number;
  levelTitle: string;
  currentStreak: number;
  categoriesCompleted: number;
  totalCategories: number;
}

export interface ThreatIntelAnalytics {
  threatsViewed: number;
  threatsBookmarked: number;
  mostViewedCategories: { category: string; count: number }[];
}

export interface SecurityImprovementItem {
  text: string;
  direction: "improved" | "declined" | "no-change";
}

export interface AnalyticsInsight {
  text: string;
}

export interface AnalyticsDashboardResponse {
  timeRange: AnalyticsTimeRange;
  overview: AnalyticsOverview;
  overallScoreTrend: SecurityScoreSnapshot[];
  categoryTrends: SecurityTrendSeries[];
  website: WebsiteAnalytics;
  phishing: PhishingAnalytics;
  password: PasswordAnalytics;
  privacy: PrivacyAnalytics;
  breach: BreachAnalytics;
  learning: LearningAnalytics;
  threatIntel: ThreatIntelAnalytics;
  improvements: SecurityImprovementItem[];
  insights: AnalyticsInsight[];
  topPriorities: SecurityRecommendation[];
  aiSummary: AiExplanation;
  partial: boolean;
  partialMessage?: string;
}

export interface AnalyticsComparisonCategoryResult {
  category: string;
  previousValue: number | null;
  currentValue: number | null;
  direction: "improved" | "declined" | "no-change" | "not-enough-data";
}

export interface AnalyticsComparisonResponse {
  previousLabel: string;
  currentLabel: string;
  results: AnalyticsComparisonCategoryResult[];
}

export interface SecurityReportData {
  generatedAt: string;
  timeRangeLabel: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  categories: SecurityCategoryResult[];
  majorFindings: string[];
  recommendations: SecurityRecommendation[];
  learning: LearningAnalytics;
  threatIntel: ThreatIntelAnalytics;
  summary: string;
}

/* -------------------------------------------------------------------- */
/* AI Security Coach                                                    */
/* -------------------------------------------------------------------- */

/**
 * ARCHITECTURE NOTE: conversations are session-only by design — there
 * is deliberately no ConversationStore or MessageStore. The spec says
 * not to automatically persist every conversation, and give the user
 * full control if persistence exists at all. The simplest, safest
 * reading of that is: don't persist conversation content server-side
 * at all. The frontend holds the message list in React state; each
 * request sends a capped slice of recent history back to the backend
 * for context, and nothing is written to disk. Only privacy-safe
 * USAGE COUNTS (see AiCoachUsageStats below) are ever stored.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ExplainContextKind =
  | "security-profile"
  | "website-scan"
  | "password-score"
  | "breach-result"
  | "phishing-result"
  | "privacy-result"
  | "analytics-trend"
  | "threat";

/** What a caller (e.g. an "Explain this result" button elsewhere in the app) can ask the Coach to focus on. */
export interface ExplainRequest {
  kind: ExplainContextKind;
  /** Only used for threat explanations — an id already validated against the Threat Intelligence catalog, never arbitrary text. */
  threatId?: string;
}

export interface AiCoachRequest {
  message: string;
  /** Recent turns only — the backend caps this further; never the entire conversation history. */
  history: ChatMessage[];
  explain?: ExplainRequest;
}

export interface RecommendedLesson {
  lessonId: string;
  title: string;
}

export interface RecommendedTool {
  label: string;
  href: string;
}

export interface AiCoachResponse {
  reply: string;
  recommendedLesson?: RecommendedLesson;
  recommendedTool?: RecommendedTool;
  /** True if any part of the reply is grounded in the user's real CyberSentinel data, for UI source-labeling. */
  usedPersonalContext: boolean;
}

/** Privacy-safe usage counters only — never conversation content. */
export interface AiCoachUsageStats {
  conversationsStarted: number;
  questionsAsked: number;
  lessonsOpened: number;
  toolsOpened: number;
}

/* -------------------------------------------------------------------- */
/* Security Action Center                                               */
/* -------------------------------------------------------------------- */

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus = "not-started" | "in-progress" | "completed" | "dismissed";

export type ActionSourceSystem =
  | "website-scanner"
  | "email-analyzer"
  | "resume-scanner"
  | "password-center"
  | "breach-checker"
  | "security-center"
  | "learning-hub"
  | "threat-intelligence"
  | "security-analytics";

/**
 * Actions are computed LIVE from existing data on every request, the
 * same way the Security Center computes its score live — there is no
 * "Actions" table of static rows. actionKey is the one thing that
 * must be stable across recomputations (e.g. "enable-mfa", not a
 * fresh random id each time), because it's the lookup key for the
 * one thing that genuinely IS persisted: the user's chosen status
 * (see services/actionStatusStore.ts). This is what lets a user mark
 * something dismissed without CyberSentinel ever deleting the
 * underlying scan/security finding it came from.
 */
export interface SecurityAction {
  actionKey: string;
  title: string;
  description: string;
  reason: string;
  priority: ActionPriority;
  sources: ActionSourceSystem[];
  recommendedToolHref?: string;
  recommendedToolLabel?: string;
  relatedLessonId?: string;
  relatedLessonTitle?: string;
  relatedThreatId?: string;
  estimatedEffortMinutes: number;
  status: ActionStatus;
  createdAt: string;
}

export interface ActionStatusRecord {
  userId: string;
  actionKey: string;
  status: ActionStatus;
  updatedAt: string;
}

export interface ActionCenterOverview {
  critical: number;
  high: number;
  recommended: number;
  completed: number;
}

export interface ActionCenterResponse {
  overview: ActionCenterOverview;
  actions: SecurityAction[];
  isNewUser: boolean;
  partial: boolean;
  partialMessage?: string;
}

export type NotificationCategory = "security" | "learning" | "threat-intelligence" | "achievement" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  relatedPage?: string;
}

export interface NotificationPreferences {
  security: boolean;
  learning: boolean;
  threatIntelligence: boolean;
  achievement: boolean;
  system: boolean;
  /**
   * Deliberately a no-op today — this app has no email provider
   * configured anywhere. The field exists so email delivery can be
   * added later without a breaking schema change, per the spec's
   * "design so it can be added safely" instruction. Toggling this
   * currently has no effect and the UI says so.
   */
  emailEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Salted hash — never the plaintext password. See utils/passwords.ts. */
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

/** Safe subset of User returned to the frontend — never includes password fields. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

/**
 * A saved scan, owned by one user. Stores the full report (so "Open
 * previous reports" can re-render the exact same UI without
 * re-scanning) plus a few denormalized summary fields so the history
 * list can search/sort without loading every full report.
 */
export interface ScanHistoryRecord {
  id: string;
  userId: string;
  url: string;
  scannedAt: string;
  score: number;
  band: Exclude<CheckStatus, "unknown">;
  httpsStatus: CheckStatus;
  recommendation: string;
  /** Short human-readable rollup, e.g. "8 safe · 1 caution · 1 unavailable". */
  apiResultsSummary: string;
  favorite: boolean;
  report: ScanReportResponse;
}

/** Fields returned by the list endpoint — excludes the full report to keep the list payload small. */
export type ScanHistorySummary = Omit<ScanHistoryRecord, "report">;

/** Aggregate stats shown above the scan history list. */
export interface ScanHistoryStats {
  total: number;
  averageScore: number;
  mostCommonBand: Exclude<CheckStatus, "unknown"> | null;
  /** Scans run in the last 7 days. */
  recentActivity: number;
}

