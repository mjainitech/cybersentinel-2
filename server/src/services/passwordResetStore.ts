import crypto from "node:crypto";
import { pool, ensureSchema } from "./dbPostgres";
import { logger } from "./logger";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface ResetTokenRecord {
  token: string;
  userId: string;
  expiresAt: string;
  used: boolean;
}

/**
 * Reset tokens require a real database — without one, there's nowhere
 * safe to store them (the JSON-file fallback would work technically,
 * but a token that survives a restart while a user's account doesn't
 * is a confusing, inconsistent experience, so this is intentionally
 * gated on the same DATABASE_URL as the rest of persistent auth).
 */
export function resetTokensAvailable(): boolean {
  return pool !== null;
}

export async function createResetToken(userId: string): Promise<string> {
  if (!pool) throw new Error("Password reset requires DATABASE_URL to be configured.");
  await ensureSchema();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await pool.query("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    userId,
    expiresAt,
  ]);

  return token;
}

export async function consumeResetToken(token: string): Promise<{ userId: string } | null> {
  if (!pool) return null;
  await ensureSchema();

  const result = await pool.query<{ user_id: string; expires_at: string; used: boolean }>(
    "SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1",
    [token]
  );
  const row = result.rows[0];
  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  // Mark used immediately so the same link can't be replayed to reset the password twice.
  await pool.query("UPDATE password_reset_tokens SET used = true WHERE token = $1", [token]).catch((error) => {
    logger.error("Failed to mark reset token as used", { error: String(error) });
  });

  return { userId: row.user_id };
}
