import crypto from "node:crypto";

interface JwtPayload {
  sub: string; // user id
  exp: number; // unix seconds
  [key: string]: unknown;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(data: string, secret: string): string {
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

/**
 * Minimal HS256 JWT implementation — just enough to issue and verify
 * our own session tokens without adding a dependency for it. Not a
 * general-purpose JWT library (no other algorithms, no key rotation);
 * fine for this app's scope since we're both the issuer and the only verifier.
 */
export function signToken(userId: string, secret: string, expiresInSeconds = SEVEN_DAYS_SECONDS): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: JwtPayload = { sub: userId, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const payloadEncoded = base64url(JSON.stringify(payload));

  const signature = sign(`${header}.${payloadEncoded}`, secret);
  return `${header}.${payloadEncoded}.${signature}`;
}

export function verifyToken(token: string, secret: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payloadEncoded, signature] = parts;
  const expectedSignature = sign(`${header}.${payloadEncoded}`, secret);

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload: JwtPayload = JSON.parse(Buffer.from(payloadEncoded, "base64").toString("utf-8"));
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
