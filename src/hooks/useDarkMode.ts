import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cybersentinel-theme";

type Theme = "dark" | "light";

/**
 * CyberSentinel ships dark-first. This hook backs the dashboard's
 * dark-mode toggle and persists the preference locally.
 * Light mode currently reuses the same tokens at reduced contrast;
 * a dedicated light palette can be layered in later without changing
 * this hook's API.
 */
export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme, isDark: theme === "dark" };
}
