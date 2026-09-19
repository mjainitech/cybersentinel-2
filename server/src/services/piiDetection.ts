import type { DetectedPiiItem, PiiCategory } from "../types";

/**
 * Every detector here is regex/heuristic-based, not true NLP. That's a
 * deliberate, honest tradeoff: reliably parsing free-form resume text
 * for things like home addresses or dates of birth is a hard NLP
 * problem, and a heuristic that's transparent about its limits is
 * more trustworthy than one that pretends to be exact. Expect
 * occasional false positives/negatives, especially for addresses.
 */

const EMAIL_PATTERN = /[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Loosely matches US-style and generically-formatted international numbers.
// Deliberately permissive — under-matching phone numbers defeats the point of this scanner.
const PHONE_PATTERN = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-z0-9\-_%]+\/?/gi;
const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-z0-9\-_]+\/?/gi;

// Any other http(s) URL — classified as "portfolio" (obviously a project link) or
// "personal-website" (looks like a root domain / personal site) by a light heuristic below.
const GENERIC_URL_PATTERN = /https?:\/\/[^\s,;)]+/gi;

// SSN-shaped (XXX-XX-XXXX) or explicit "SSN"/"social security"/"passport" mentions followed by digits.
const SSN_SHAPED_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const GOV_ID_KEYWORD_PATTERN =
  /\b(?:ssn|social security(?:\s+number)?|passport(?:\s+no\.?|\s+number)?|national\s+id)\b[\s:#-]*([a-z0-9-]{5,20})/gi;

const DOB_KEYWORD_PATTERN =
  /\b(?:date of birth|dob|born on|born)\b[\s:]*((?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|(?:[a-z]+\s+\d{1,2},?\s+\d{4}))/gi;

// Street-suffix + leading number, OR a 5-digit ZIP directly preceded by a comma+state-like token.
const STREET_ADDRESS_PATTERN =
  /\b\d{1,5}\s+[a-z0-9.\s]{2,40}\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|way|place|pl\.?|suite|ste\.?|apt\.?|circle|cir\.?)\b/gi;
const ZIP_WITH_STATE_PATTERN = /\b[a-z]{2}\s+\d{5}(?:-\d{4})?\b/gi;

function unique(items: DetectedPiiItem[]): DetectedPiiItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}:${item.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Masks all but the last 2 characters — used for anything we don't want echoed back in full. */
function mask(value: string): string {
  const visible = value.slice(-2);
  return `${"•".repeat(Math.max(value.length - 2, 3))}${visible}`;
}

export function detectPii(text: string): DetectedPiiItem[] {
  const results: DetectedPiiItem[] = [];

  for (const match of text.match(EMAIL_PATTERN) ?? []) {
    results.push({ category: "email", label: "Email Address", value: match });
  }

  for (const match of text.match(PHONE_PATTERN) ?? []) {
    // Phone regex is permissive enough to occasionally catch things like long ID numbers —
    // require at least 10 digits total to cut down on obvious false positives.
    const digitCount = match.replace(/\D/g, "").length;
    if (digitCount >= 10) {
      results.push({ category: "phone", label: "Phone Number", value: match.trim() });
    }
  }

  for (const match of text.match(LINKEDIN_PATTERN) ?? []) {
    results.push({ category: "linkedin", label: "LinkedIn Profile", value: match });
  }

  for (const match of text.match(GITHUB_PATTERN) ?? []) {
    results.push({ category: "github", label: "GitHub Profile", value: match });
  }

  const linkedinAndGithub = new Set([
    ...(text.match(LINKEDIN_PATTERN) ?? []),
    ...(text.match(GITHUB_PATTERN) ?? []),
  ]);
  for (const match of text.match(GENERIC_URL_PATTERN) ?? []) {
    if (linkedinAndGithub.has(match)) continue;
    // Heuristic: URLs containing a path segment beyond the domain read as a specific
    // project/work sample ("portfolio"); a bare domain reads as a personal site.
    const pathDepth = (match.split("/").length ?? 0) - 3; // subtract protocol + empty + domain
    results.push({
      category: pathDepth > 0 ? "portfolio" : "personal-website",
      label: pathDepth > 0 ? "Portfolio / Project Link" : "Personal Website",
      value: match,
    });
  }

  for (const match of text.match(SSN_SHAPED_PATTERN) ?? []) {
    results.push({ category: "government-id", label: "Government ID Number", value: mask(match) });
  }
  for (const match of text.matchAll(GOV_ID_KEYWORD_PATTERN)) {
    if (match[1]) results.push({ category: "government-id", label: "Government ID Number", value: mask(match[1]) });
  }

  for (const match of text.matchAll(DOB_KEYWORD_PATTERN)) {
    if (match[1]) results.push({ category: "date-of-birth", label: "Date of Birth", value: match[1] });
  }

  for (const match of text.match(STREET_ADDRESS_PATTERN) ?? []) {
    results.push({ category: "address", label: "Home Address", value: match.trim() });
  }
  for (const match of text.match(ZIP_WITH_STATE_PATTERN) ?? []) {
    results.push({ category: "address", label: "Home Address", value: match.trim() });
  }

  return unique(results);
}

export const PII_CATEGORY_LABELS: Record<PiiCategory, string> = {
  phone: "Phone Number",
  email: "Email Address",
  address: "Home Address",
  linkedin: "LinkedIn Profile",
  github: "GitHub Profile",
  portfolio: "Portfolio / Project Link",
  "personal-website": "Personal Website",
  "date-of-birth": "Date of Birth",
  "government-id": "Government ID Number",
  // No automated detector currently populates this — it's here so scoring/labels
  // stay consistent if a future rule (e.g. a specific keyword list) starts using it.
  "sensitive-other": "Other Sensitive Information",
};
