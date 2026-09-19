/**
 * CRITICAL: everything in this file runs entirely in the browser.
 * The password string passed in here is never sent to any network
 * request, never logged, and never persisted — see the Password
 * Security Center page for how the *result* of this analysis (a
 * score, a rating, recommendation text) is the only thing that ever
 * gets saved, and only if the user is signed in.
 */

export type PasswordRating = "very-weak" | "weak" | "fair" | "strong" | "excellent";

export interface PasswordCheckItem {
  id: string;
  label: string;
  passed: boolean;
}

/** Reuses the exact shape ResumeRecommendationsList already renders — see the component for why. */
export interface PasswordRecommendation {
  id: string;
  text: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface PasswordAnalysis {
  score: number;
  rating: PasswordRating;
  resistanceDescription: string;
  checks: PasswordCheckItem[];
  recommendations: PasswordRecommendation[];
  estimatedEntropyBits: number;
  length: number;
}

/**
 * A small sample of extremely common passwords, not an exhaustive
 * breach-corpus list — this is enough to catch the most obvious
 * cases without shipping a multi-megabyte list to the browser.
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "123456789",
  "12345678",
  "qwerty",
  "111111",
  "abc123",
  "password1",
  "iloveyou",
  "admin",
  "welcome",
  "monkey",
  "letmein",
  "dragon",
  "football",
  "master",
  "sunshine",
  "princess",
  "qwerty123",
  "trustno1",
  "123123",
  "000000",
  "1q2w3e4r",
  "starwars",
  "login",
  "passw0rd",
]);

/** A small curated sample of common English dictionary words worth flagging — not a real dictionary. */
const COMMON_WORDS = new Set([
  "love",
  "money",
  "summer",
  "winter",
  "spring",
  "autumn",
  "family",
  "friend",
  "happy",
  "flower",
  "tiger",
  "eagle",
  "shadow",
  "phoenix",
  "wizard",
  "hunter",
  "soccer",
  "baseball",
  "basketball",
  "computer",
  "internet",
  "freedom",
  "music",
  "guitar",
  "ninja",
  "pirate",
  "dolphin",
  "diamond",
  "silver",
  "golden",
]);

const KEYBOARD_PATTERNS = [
  "qwerty",
  "qwertyuiop",
  "asdfgh",
  "asdfghjkl",
  "zxcvbn",
  "zxcvbnm",
  "1qaz2wsx",
  "qazwsx",
  "1234567890",
];

/** Checks for 3+ character runs going up or down, e.g. "abc", "cba", "123", "987". */
function hasSequentialRun(lower: string): boolean {
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) return true;
    if (b - a === -1 && c - b === -1) return true;
  }
  return false;
}

/** Checks for any character repeated 3+ times in a row, e.g. "aaa", "111". */
function hasRepeatedCharacters(value: string): boolean {
  for (let i = 0; i < value.length - 2; i++) {
    if (value[i] === value[i + 1] && value[i + 1] === value[i + 2]) return true;
  }
  return false;
}

/** Checks whether the same word/token appears more than once, split on common separators. */
function hasRepeatedWords(lower: string): boolean {
  const tokens = lower.split(/[\s\-_.,!]+/).filter((t) => t.length >= 3);
  return new Set(tokens).size < tokens.length;
}

function containsKeyboardPattern(lower: string): boolean {
  return KEYBOARD_PATTERNS.some((pattern) => lower.includes(pattern) || lower.includes([...pattern].reverse().join("")));
}

function containsDictionaryWord(lower: string): string | null {
  for (const word of COMMON_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

/**
 * Estimates entropy using the standard pool-size formula:
 * bits = length * log2(pool size), where pool size is the sum of
 * character categories actually used. This is a rough estimate, not
 * a measure of true randomness — a password built from a real phrase
 * (e.g. "correcthorsebatterystaple") has far less real entropy than
 * this formula alone would suggest, which is exactly why the
 * dictionary/pattern checks below matter just as much as this number.
 */
function estimateEntropyBits(value: string): number {
  let poolSize = 0;
  if (/[a-z]/.test(value)) poolSize += 26;
  if (/[A-Z]/.test(value)) poolSize += 26;
  if (/[0-9]/.test(value)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(value)) poolSize += 32;

  if (poolSize === 0 || value.length === 0) return 0;
  return Math.round(value.length * Math.log2(poolSize));
}

function getResistanceDescription(rating: PasswordRating): string {
  switch (rating) {
    case "very-weak":
      return "Very easy to guess";
    case "weak":
      return "Could be guessed quickly";
    case "fair":
      return "Reasonably resistant";
    case "strong":
    case "excellent":
      return "Strong against common attacks";
  }
}

function getRating(score: number): PasswordRating {
  if (score >= 90) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 50) return "fair";
  if (score >= 25) return "weak";
  return "very-weak";
}

/**
 * Runs the full analysis. Called on every keystroke from the page —
 * kept synchronous and allocation-light since it needs to feel instant.
 */
export function analyzePassword(password: string): PasswordAnalysis {
  const lower = password.toLowerCase();
  const length = password.length;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const isCommonPassword = COMMON_PASSWORDS.has(lower);
  const dictionaryWord = containsDictionaryWord(lower);
  const hasKeyboardPattern = containsKeyboardPattern(lower);
  const hasSequential = hasSequentialRun(lower);
  const hasRepeatedChars = hasRepeatedCharacters(password);
  const hasRepeatedWordTokens = hasRepeatedWords(lower);
  const entropyBits = estimateEntropyBits(password);

  const checks: PasswordCheckItem[] = [
    { id: "length", label: "At least 12 characters", passed: length >= 12 },
    { id: "uppercase", label: "Contains uppercase letters", passed: hasUppercase },
    { id: "lowercase", label: "Contains lowercase letters", passed: hasLowercase },
    { id: "number", label: "Contains numbers", passed: hasNumber },
    { id: "symbol", label: "Contains symbols", passed: hasSymbol },
    { id: "no-repeated-chars", label: "No repeated characters (e.g. \"aaa\")", passed: !hasRepeatedChars },
    { id: "no-repeated-words", label: "No repeated words", passed: !hasRepeatedWordTokens },
    { id: "no-keyboard-pattern", label: "No keyboard patterns (e.g. \"qwerty\")", passed: !hasKeyboardPattern },
    { id: "no-sequential", label: "No sequential characters (e.g. \"abc\", \"123\")", passed: !hasSequential },
    { id: "not-common", label: "Not a commonly used password", passed: !isCommonPassword },
    { id: "not-dictionary", label: "Not built from a common dictionary word", passed: !dictionaryWord },
  ];

  // Scoring: start from entropy (capped), then apply flat penalties for
  // the specific weaknesses above — a long password that's still just a
  // well-known dictionary word or common password should score very low
  // regardless of what raw entropy math alone would suggest.
  let score = Math.min(70, entropyBits); // entropy alone can't carry a score past 70
  if (length >= 12) score += 10;
  if (length >= 16) score += 8;
  if (hasUppercase) score += 3;
  if (hasLowercase) score += 3;
  if (hasNumber) score += 3;
  if (hasSymbol) score += 5;

  if (isCommonPassword) score = Math.min(score, 5);
  if (dictionaryWord && length < 16) score -= 20;
  if (hasKeyboardPattern) score -= 25;
  if (hasSequential) score -= 15;
  if (hasRepeatedChars) score -= 15;
  if (hasRepeatedWordTokens) score -= 10;
  if (length < 8) score = Math.min(score, 20);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = getRating(score);

  const recommendations = buildRecommendations({
    length,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    isCommonPassword,
    dictionaryWord,
    hasKeyboardPattern,
    hasSequential,
    hasRepeatedChars,
    hasRepeatedWordTokens,
    rating,
  });

  return {
    score,
    rating,
    resistanceDescription: getResistanceDescription(rating),
    checks,
    recommendations,
    estimatedEntropyBits: entropyBits,
    length,
  };
}

interface RecommendationInputs {
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isCommonPassword: boolean;
  dictionaryWord: string | null;
  hasKeyboardPattern: boolean;
  hasSequential: boolean;
  hasRepeatedChars: boolean;
  hasRepeatedWordTokens: boolean;
  rating: PasswordRating;
}

const PRIORITY_ORDER: Record<PasswordRecommendation["priority"], number> = { high: 0, medium: 1, low: 2 };

function buildRecommendations(input: RecommendationInputs): PasswordRecommendation[] {
  const recs: PasswordRecommendation[] = [];

  if (input.isCommonPassword) {
    recs.push({
      id: "common-password",
      text: "Stop using this password immediately.",
      reason: "This is one of the most commonly used passwords, meaning it's likely one of the very first things an attacker tries.",
      priority: "high",
    });
  }
  if (input.hasKeyboardPattern) {
    recs.push({
      id: "keyboard-pattern",
      text: 'Avoid keyboard patterns like "qwerty" or "asdf".',
      reason: "These patterns are fast to type but just as fast for automated guessing tools to try first.",
      priority: "high",
    });
  }
  if (input.dictionaryWord && input.length < 16) {
    recs.push({
      id: "dictionary-word",
      text: "Avoid basing your password on a single common word.",
      reason: `"${input.dictionaryWord}" (or a word like it) is exactly the kind of term dictionary-based guessing tools try first.`,
      priority: "high",
    });
  }
  if (input.length < 12) {
    recs.push({
      id: "increase-length",
      text: "Increase your password's length to at least 12 characters.",
      reason: "Length is the single biggest factor in how long a password would take to guess — every extra character multiplies the possibilities.",
      priority: input.length < 8 ? "high" : "medium",
    });
  }
  if (input.hasSequential) {
    recs.push({
      id: "sequential",
      text: 'Avoid sequential characters like "abc" or "123".',
      reason: "Sequential runs are predictable and among the first patterns automated tools check for.",
      priority: "medium",
    });
  }
  if (input.hasRepeatedChars || input.hasRepeatedWordTokens) {
    recs.push({
      id: "repetition",
      text: "Avoid repeating the same character or word.",
      reason: "Repetition reduces the real randomness of a password without making it noticeably harder to guess.",
      priority: "medium",
    });
  }
  if (!input.hasSymbol) {
    recs.push({
      id: "add-symbols",
      text: "Add a symbol or two.",
      reason: "Expanding the character set increases the number of possible combinations an attacker would need to try.",
      priority: "low",
    });
  }
  if (!input.hasUppercase || !input.hasLowercase) {
    recs.push({
      id: "mix-case",
      text: "Mix uppercase and lowercase letters.",
      reason: "Using both cases expands the character pool, adding real difficulty for very little extra effort to type.",
      priority: "low",
    });
  }

  // Evergreen advice that applies almost regardless of this one password's strength.
  recs.push({
    id: "use-password-manager",
    text: "Consider using a password manager.",
    reason: "A password manager lets you use a long, unique, random password for every account without needing to memorize any of them.",
    priority: input.rating === "excellent" || input.rating === "strong" ? "low" : "medium",
  });
  recs.push({
    id: "enable-mfa",
    text: "Enable multi-factor authentication wherever it's offered.",
    reason: "Even a strong password can eventually be compromised — MFA means a stolen password alone usually isn't enough to get in.",
    priority: "low",
  });

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]).slice(0, 7);
}
