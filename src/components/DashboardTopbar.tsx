import { Menu, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";

interface DashboardTopbarProps {
  onMenuClick: () => void;
}

/**
 * Top bar for the dashboard shell: mobile menu trigger, notifications,
 * dark mode toggle, and the current user's avatar. Reads the signed-in
 * user directly from useAuth() rather than taking it as a prop, so
 * every page under DashboardLayout shows the real account automatically.
 */
export function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const { isDark, toggleTheme } = useDarkMode();
  const { user } = useAuth();

  const initials = user
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-base-border bg-base/80 px-6 py-4 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-base-elevated hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        {user ? (
          <>
            <p className="text-sm text-ink-faint">Signed in as</p>
            <p className="text-sm font-medium text-ink">{user.name}</p>
          </>
        ) : (
          <Link to="/login" className="text-sm font-medium text-accent-primary hover:underline">
            Sign in
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="rounded-lg p-2.5 text-ink-muted transition-colors hover:bg-base-elevated hover:text-ink"
        >
          {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </button>

        <NotificationCenter />

        <button
          aria-label="Open profile menu"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-cta-gradient text-xs font-semibold text-white"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
