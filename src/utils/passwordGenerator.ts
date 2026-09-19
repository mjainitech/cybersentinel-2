/**
 * Uses crypto.getRandomValues() (Web Crypto API), not Math.random() —
 * Math.random() is not cryptographically secure and shouldn't be used
 * to generate anything security-sensitive like a password.
 */

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  /** Excludes visually similar characters: i, l, 1, L, o, 0, O */
  excludeSimilar: boolean;
  /** Excludes symbols that can be ambiguous or awkward in some contexts: { } [ ] ( ) / \ ' " ~ , ; : . < > */
  excludeAmbiguous: boolean;
}

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*_+-=?",
  ambiguousSymbols: "{}[]()/\\'\"~,;:.<>",
  similarChars: "il1Lo0O",
};

function buildCharacterPool(options: PasswordGeneratorOptions): string {
  let pool = "";
  if (options.includeUppercase) pool += CHAR_SETS.uppercase;
  if (options.includeLowercase) pool += CHAR_SETS.lowercase;
  if (options.includeNumbers) pool += CHAR_SETS.numbers;
  if (options.includeSymbols) pool += options.excludeAmbiguous ? CHAR_SETS.symbols : CHAR_SETS.symbols + CHAR_SETS.ambiguousSymbols;

  if (options.excludeSimilar) {
    pool = [...pool].filter((char) => !CHAR_SETS.similarChars.includes(char)).join("");
  }

  return pool;
}

/** Returns a cryptographically random integer in [0, max). */
function secureRandomIndex(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Rejection-free enough for UI purposes; a tiny modulo bias exists but is
  // negligible for password generation (not a cryptographic protocol).
  return array[0] % max;
}

export function generatePassword(options: PasswordGeneratorOptions): string {
  const pool = buildCharacterPool(options);
  if (pool.length === 0) return "";

  const chars: string[] = [];
  for (let i = 0; i < options.length; i++) {
    chars.push(pool[secureRandomIndex(pool.length)]);
  }
  return chars.join("");
}

export function generatePasswordOptions(options: PasswordGeneratorOptions, count = 5): string[] {
  return Array.from({ length: count }, () => generatePassword(options));
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: true,
  excludeAmbiguous: false,
};
