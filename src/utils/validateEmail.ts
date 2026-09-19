export type EmailValidationResult = { valid: true; email: string } | { valid: false; error: string };

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(rawInput: string): EmailValidationResult {
  const email = rawInput.trim();

  if (!email) {
    return { valid: false, error: "Please enter an email address to check." };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { valid: false, error: "That doesn't look like a valid email address." };
  }

  return { valid: true, email: email.toLowerCase() };
}
