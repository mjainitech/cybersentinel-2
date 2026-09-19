import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import { pool, ensureSchema } from "./dbPostgres";
import { hashPassword, verifyPassword } from "../utils/passwords";
import type { PublicUser, User } from "../types";

// Fallback used only when DATABASE_URL isn't configured — same
// graceful-degradation pattern as every other feature in this app.
// Accounts saved here do NOT survive a restart on hosts with an
// ephemeral filesystem (e.g. Render's free tier).
const fileStore = new JsonFileStore<User[]>(path.join(__dirname, "..", "..", "data", "users.json"), []);

function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  if (pool) {
    await ensureSchema();
    const result = await pool.query<UserRow>("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  const users = await fileStore.read();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  if (pool) {
    await ensureSchema();
    const result = await pool.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  const users = await fileStore.read();
  return users.find((user) => user.id === id);
}

export async function createUser(name: string, email: string, password: string): Promise<PublicUser> {
  const { hash, salt } = hashPassword(password);

  if (pool) {
    await ensureSchema();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash, password_salt) VALUES ($1, $2, $3, $4, $5)",
      [id, name, email, hash, salt]
    );
    return { id, name, email };
  }

  const users = await fileStore.read();
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await fileStore.write(users);
  return toPublicUser(user);
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  return valid ? toPublicUser(user) : null;
}

/** Used by the password-reset flow to actually change a user's password after a valid token is presented. */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const { hash, salt } = hashPassword(newPassword);

  if (pool) {
    await ensureSchema();
    await pool.query("UPDATE users SET password_hash = $1, password_salt = $2 WHERE id = $3", [hash, salt, userId]);
    return;
  }

  const users = await fileStore.read();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return;
  users[index] = { ...users[index], passwordHash: hash, passwordSalt: salt };
  await fileStore.write(users);
}

export { toPublicUser };
