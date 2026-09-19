import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getAuthToken, setAuthToken } from "@/services/authToken";
import { registerAccount, loginAccount, fetchCurrentUser } from "@/services/authService";
import type { PublicUser } from "@/services/authService";

interface AuthContextValue {
  user: PublicUser | null;
  /** True while checking an existing token on first load — lets pages avoid flashing a "logged out" state. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * App-wide auth state. Wrap the app once (see main.tsx). On mount, if
 * a token already exists (from a previous session), it's verified
 * against the backend so a stale/expired token doesn't leave the UI
 * thinking someone's logged in when they're not.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => setAuthToken(null)) // token expired or invalid — clear it quietly
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await loginAccount(email, password);
    setAuthToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await registerAccount(name, email, password);
    setAuthToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
