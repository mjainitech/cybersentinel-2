export type EmailValidationResult = { valid: true; email: string } | { valid: false; error: string };

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Validates and normalizes (lowercases, trims) an email address. The backend never trusts client-side validation alone. */
export function validateEmail(rawInput: unknown): EmailValidationResult {
  if (typeof rawInput !== "string" || !rawInput.trim()) {
    return { valid: false, error: "Please enter an email address to check." };
  }

  const email = rawInput.trim().toLowerCase();

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { valid: false, error: "That doesn't look like a valid email address." };
  }

  return { valid: true, email };
}
