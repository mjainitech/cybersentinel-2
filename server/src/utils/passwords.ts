import crypto from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hashes a password with scrypt (built into Node — no bcrypt/argon2
 * dependency to install). Returns a random salt alongside the hash;
 * both must be stored and both are required to verify later.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return { hash, salt };
}

/** Timing-safe comparison so verification time doesn't leak information about the correct hash. */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actualHash = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expected.length) return false;
  return crypto.timingSafeEqual(actualHash, expected);
}
