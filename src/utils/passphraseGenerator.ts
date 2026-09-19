import { PASSPHRASE_WORDLIST } from "./passphraseWordlist";

export type PassphraseCapitalization = "none" | "first-letter" | "all-caps" | "random";

export interface PassphraseGeneratorOptions {
  wordCount: number;
  separator: string;
  capitalization: PassphraseCapitalization;
  includeNumber: boolean;
  includeSymbol: boolean;
}

const APPEND_SYMBOLS = "!@#$%*?";

function secureRandomIndex(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function pickRandomWord(): string {
  return PASSPHRASE_WORDLIST[secureRandomIndex(PASSPHRASE_WORDLIST.length)];
}

function applyCapitalization(word: string, mode: PassphraseCapitalization): string {
  switch (mode) {
    case "first-letter":
      return word.charAt(0).toUpperCase() + word.slice(1);
    case "all-caps":
      return word.toUpperCase();
    case "random":
      return secureRandomIndex(2) === 0 ? word.toUpperCase() : word;
    case "none":
    default:
      return word;
  }
}

export function generatePassphrase(options: PassphraseGeneratorOptions): string {
  const words = Array.from({ length: options.wordCount }, () => applyCapitalization(pickRandomWord(), options.capitalization));

  if (options.includeNumber) {
    words.push(String(secureRandomIndex(100)));
  }
  if (options.includeSymbol) {
    words.push(APPEND_SYMBOLS[secureRandomIndex(APPEND_SYMBOLS.length)]);
  }

  return words.join(options.separator);
}

export function generatePassphraseOptions(options: PassphraseGeneratorOptions, count = 5): string[] {
  return Array.from({ length: count }, () => generatePassphrase(options));
}

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseGeneratorOptions = {
  wordCount: 4,
  separator: "-",
  capitalization: "first-letter",
  includeNumber: true,
  includeSymbol: false,
};
