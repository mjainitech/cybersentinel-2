import { NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, LogIn } from "lucide-react";
import { Logo } from "@/components/Logo";
import { sidebarNav } from "@/services/placeholderData";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

interface SidebarProps {
  /** Controls the mobile slide-in drawer; ignored on desktop where the sidebar is static. */
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Left navigation for the authenticated dashboard. Renders as a static
 * column on desktop and a slide-in drawer on mobile, driven by isOpen.
 */
export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    onClose?.();
    navigate("/");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-base-border bg-base-surface/95 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center px-6 py-6">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === "/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary ring-1 ring-inset ring-accent-primary/25"
                      : "text-ink-muted hover:bg-base-elevated hover:text-ink"
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Security score teaser + sign out, anchored to the bottom */}
        <div className="mx-3 mb-4 rounded-xl border border-base-border bg-base-elevated/60 p-4">
          <div className="flex items-center gap-2 text-accent-secondary">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Security score</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Run your first scan to unlock a personalized score.
          </p>
        </div>

        {user ? (
          <button
            onClick={handleSignOut}
            className="mx-3 mb-6 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-base-elevated hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Sign out
          </button>
        ) : (
          <NavLink
            to="/login"
            onClick={onClose}
            className="mx-3 mb-6 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-base-elevated hover:text-ink"
          >
            <LogIn className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Log in
          </NavLink>
        )}
      </aside>
    </>
  );
}
