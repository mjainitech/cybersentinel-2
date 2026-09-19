import { Pool } from "pg";
import { env } from "../config/env";
import { logger } from "./logger";

/**
 * A real, persistent database connection — used specifically for data
 * that MUST survive a server restart (accounts, password reset
 * tokens). Everything else in this project still uses JsonFileStore
 * (services/db.ts) by deliberate choice, since migrating every
 * feature to Postgres is a larger undertaking than the immediate
 * problem (users losing their accounts) required. See README for the
 * full rationale.
 */
export const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      // Neon (and most managed Postgres free tiers) require SSL, and
      // supplying a CA bundle isn't practical for a small project like
      // this — rejectUnauthorized: false is the standard, accepted
      // tradeoff for connecting to a trusted managed provider this way.
      ssl: { rejectUnauthorized: false },
    })
  : null;

let migrationPromise: Promise<void> | null = null;

/**
 * Creates the tables this project needs if they don't already exist.
 * Safe to call on every boot — CREATE TABLE IF NOT EXISTS is a no-op
 * once the schema is in place. Runs once per process via the cached
 * promise below, so concurrent early requests don't race each other.
 */
export function ensureSchema(): Promise<void> {
  if (!pool) return Promise.resolve();
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool!.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    logger.info("Database schema ready (users, password_reset_tokens).");
  })().catch((error) => {
    logger.error("Failed to set up database schema", { error: String(error) });
    migrationPromise = null; // allow a retry on the next call rather than staying permanently broken
    throw error;
  });

  return migrationPromise;
}
