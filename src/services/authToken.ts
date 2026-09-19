const STORAGE_KEY = "cybersentinel-auth-token";

let currentToken: string | null = localStorage.getItem(STORAGE_KEY);

/**
 * Holds the current session token in memory (synced to localStorage).
 * Kept separate from the AuthProvider/useAuth React context so plain
 * service functions (scanService, scanHistoryService) can read the
 * token synchronously when building a request, without needing to be
 * React components themselves.
 *
 * Note: storing a JWT in localStorage is the common, simple approach
 * for a project at this stage. A production app handling sensitive
 * data might prefer an httpOnly cookie instead, which isn't readable
 * by JavaScript at all — that's a reasonable next hardening step.
 */
export function getAuthToken(): string | null {
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Builds the Authorization header if a token is present, or an empty object if not — spread directly into a fetch's headers. */
export function authHeader(): Record<string, string> {
  return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
}
